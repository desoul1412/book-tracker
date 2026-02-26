import streamlit as st
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import pandas as pd
from datetime import datetime

# --- CONFIG ---
st.set_page_config(page_title="My Book Shelf", layout="wide", page_icon="📚")

# --- CUSTOM CSS ---
st.markdown("""
<style>
    div[data-testid="stImage"] img { height: 300px !important; object-fit: cover !important; border-radius: 8px; width: 100% !important; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    div[data-testid="stButton"] button { width: 100%; border: none !important; background: transparent !important; color: #2d3748 !important; font-weight: 800 !important; font-size: 15px !important; text-align: center !important; }
    .book-header { background-color: #5b8aed; color: white; padding: 15px; text-align: center; font-weight: bold; font-size: 24px; border-radius: 8px 8px 0 0; text-transform: uppercase; }
    button[kind="primary"] { background-color: #5b8aed !important; color: white !important; font-weight: bold !important; }
    button[kind="secondary"] { border-color: #fc8181 !important; color: #c53030 !important; }
    .css-15zrgzn {display: none}
    div[data-testid="stFeedback"] { justify-content: center; }
</style>
""", unsafe_allow_html=True)

# --- AUTH ---
creds_dict = st.secrets["gcp_service_account"] if "gcp_service_account" in st.secrets else None
bot_email = creds_dict["client_email"] if creds_dict else "Unavailable"

def connect_to_sheet(sheet_url):
    try:
        scope = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
        creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, scope)
        client = gspread.authorize(creds)
        return client.open_by_url(sheet_url), None
    except Exception as e: return None, str(e)

# --- SIDEBAR ---
st.sidebar.title("📚 My Book Shelf")

if 'sheet_conn' not in st.session_state:
    st.sidebar.info(f"Share Sheet with (Editor): {bot_email}")
    sheet_url = st.sidebar.text_input("Paste Sheet URL:")
    if st.sidebar.button("Connect Library", type="primary"):
        sheet, err = connect_to_sheet(sheet_url)
        if sheet: st.session_state['sheet_conn'] = sheet; st.rerun()
        else: st.sidebar.error(err)
else:
    # --- ADD BOOK (DIRECT SYNC) ---
    with st.sidebar.expander("➕ Add New Book", expanded=False):
        with st.form("add_book_form", clear_on_submit=True):
            n_title = st.text_input("Book Name *")
            n_author = st.text_input("Author *")
            n_cover = st.text_input("Cover URL")
            n_status = st.selectbox("Status", ["To Read", "Reading", "Read", "DNF"])
            if st.form_submit_button("Add Book", type="primary"):
                try:
                    ws = st.session_state['sheet_conn'].worksheet("Form Responses")
                    headers = [h.strip() for h in ws.row_values(1)]
                    new_row = [""] * len(headers)
                    mapping = {"Timestamp": datetime.now().strftime("%m/%d/%Y %H:%M:%S"), "Author": n_author, "Title": n_title, "Reading Status": n_status, "Cover URL": n_cover}
                    for i, h in enumerate(headers):
                        if h in mapping: new_row[i] = mapping[h]
                    ws.insert_row(new_row, 2) 
                    st.toast("✅ Added to Shelf!"); st.rerun()
                except Exception as e: st.error(f"Sync Error: {e}")

# --- MAIN APP ---
if 'sheet_conn' in st.session_state:
    try:
        ws = st.session_state['sheet_conn'].worksheet("Form Responses")
        raw_data = ws.get_all_values()
        if not raw_data: st.stop()
        header_row = [h.strip() for h in raw_data[0]]
        clean_header = [h if h else f"EMPTY_{i}" for i, h in enumerate(header_row)]
        df = pd.DataFrame(raw_data[1:], columns=clean_header)

        # 20-COLUMN MAPPING
        col_map = {
            "T": "Title", "A": "Author", "S": "Reading Status", "C": "Cover URL", 
            "R": "Rating", "Src": "Source", "P": "Primary Genre", "Sec": "Secondary Genre(s)",
            "Tr": "Tropes", "O": "Owned?", "Rev": "Reviews", "F": "Format", "D": "Date Finished",
            "Sn": "Series Name", "S#": "Number in Series", "Time": "Timestamp"
        }

        df = df[df[col_map["T"]].astype(str).str.strip() != ""]
        df['real_row_index'] = df.index + 2

        # --- FILTERS ---
        st.sidebar.markdown("---")
        st.sidebar.subheader("🔍 Filters")
        filtered_df = df.copy()

        def split_filter(label, col):
            if col in df.columns:
                items = df[col].astype(str).str.split(',').explode().str.strip()
                unique = sorted([x for x in items.unique() if x and x.lower() != 'nan' and "EMPTY" not in x])
                return st.sidebar.multiselect(label, unique)
            return []

        f_auth = st.sidebar.multiselect("Author", sorted(df[col_map["A"]].unique()))
        f_stat = st.sidebar.multiselect("Reading Status", sorted(df[col_map["S"]].unique()))
        f_pri = split_filter("Primary Genre", col_map["P"])
        f_sec = split_filter("Secondary Genre(s)", col_map["Sec"])
        f_trp = split_filter("Tropes", col_map["Tr"])

        if f_auth: filtered_df = filtered_df[filtered_df[col_map["A"]].isin(f_auth)]
        if f_stat: filtered_df = filtered_df[filtered_df[col_map["S"]].isin(f_stat)]
        for f_list, col in [(f_pri, col_map["P"]), (f_sec, col_map["Sec"]), (f_trp, col_map["Tr"])]:
            if f_list and col in df.columns:
                pat = '|'.join([f"^{x}$|^{x},|, {x},|, {x}$" for x in f_list])
                filtered_df = filtered_df[filtered_df[col].astype(str).str.contains(pat, case=False, na=False)]

        # --- SEARCH & SORT ---
        s1, s2 = st.columns([2, 1])
        with s1:
            all_titles = sorted(df[col_map["T"]].unique().tolist())
            search_choice = st.selectbox("🔍 Search Book:", [""] + all_titles)
            if search_choice: filtered_df = filtered_df[filtered_df[col_map["T"]] == search_choice]
        with s2:
            sort_opt = st.selectbox("Sort By:", ["Newest Added", "Oldest Added", "Title (A-Z)", "Title (Z-A)", "Rating (High-Low)"])
            if "A-Z" in sort_opt: filtered_df = filtered_df.sort_values(col_map["T"])
            elif "Z-A" in sort_opt: filtered_df = filtered_df.sort_values(col_map["T"], ascending=False)
            elif "Rating" in sort_opt: 
                filtered_df['_r'] = filtered_df[col_map["R"]].str.count('★')
                filtered_df = filtered_df.sort_values('_r', ascending=False)
            elif "Oldest" in sort_opt: filtered_df = filtered_df.sort_values(col_map["Time"])
            else: filtered_df = filtered_df.sort_values(col_map["Time"], ascending=False)

        # --- MODAL ---
        @st.dialog("Book Details", width="large")
        def show_modal(row):
            st.markdown("<div class='book-header'>BOOK VIEW</div>", unsafe_allow_html=True)
            c1, c2 = st.columns([1, 1.5], gap="large")
            with c1:
                st.subheader(row[col_map["T"]])
                st.write(f"*{row[col_map['A']]}*")
                col_sub1, col_sub2 = st.columns([1, 2])
                s_num = col_sub1.text_input("#", value=str(row.get(col_map["S#"], "")))
                s_name = col_sub2.text_input("Series", value=str(row.get(col_map["Sn"], "")))
                st.image(row.get(col_map["C"]) or "https://via.placeholder.com/300", use_container_width=True)
                st.write("Rating")
                r_val = str(row[col_map["R"]]).count('★')
                new_r = st.feedback("stars", key=f"s_{row['real_row_index']}")
                final_r = (new_r + 1) if new_r is not None else r_val
                new_st = st.selectbox("Status", ["To Read", "Reading", "Read", "DNF"], index=["To Read", "Reading", "Read", "DNF"].index(row[col_map["S"]]) if row[col_map["S"]] in ["To Read", "Reading", "Read", "DNF"] else 0)
            with c2:
                r_a, r_b = st.columns(2)
                new_date = r_a.text_input("Date Finished", value=row.get(col_map["D"], ""))
                new_own = r_b.text_input("Owned?", value=row.get(col_map["O"], ""))
                r_c, r_d = st.columns(2)
                new_fmt = r_c.text_input("Format", value=row.get(col_map["F"], ""))
                new_src = r_d.text_input("Source", value=row.get(col_map["Src"], ""))
                new_p = st.text_area("Primary Genre", value=row.get(col_map["P"], ""), height=68)
                new_s = st.text_area("Secondary Genre", value=row.get(col_map["Sec"], ""), height=100)
                new_t = st.text_area("Tropes", value=row.get(col_map["Tr"], ""), height=80)
                new_rev = st.text_area("Reviews", value=row.get(col_map["Rev"], ""), height=150)
                cd, cs = st.columns(2)
                if cd.button("🗑️ Remove", type="secondary"): ws.delete_rows(int(row['real_row_index'])); st.rerun()
                if cs.button("💾 Save", type="primary"):
                    h_list = [h.strip() for h in header_row]
                    def up(c, v): 
                        if c in h_list: ws.update_cell(int(row['real_row_index']), h_list.index(c)+1, v)
                    up(col_map["S"], new_st); up(col_map["R"], "★" * final_r)
                    up(col_map["Rev"], new_rev); up(col_map["D"], new_date); up(col_map["O"], new_own)
                    up(col_map["P"], new_p); up(col_map["Sec"], new_s); up(col_map["Tr"], new_t)
                    up(col_map["Sn"], s_name); up(col_map["S#"], s_num); up(col_map["F"], new_fmt); up(col_map["Src"], new_src)
                    st.toast("Saved!"); st.rerun()

        # --- GRID ---
        st.write(f"**Showing {len(filtered_df)} books**")
        grid = st.columns(5)
        for i, (idx, row) in enumerate(filtered_df.iterrows()):
            with grid[i % 5]:
                st.image(row.get(col_map["C"]) or "https://via.placeholder.com/300", use_container_width=True)
                if st.button(row[col_map["T"]], key=f"btn_{idx}"): show_modal(row)
    except Exception as e: st.error(f"Error: {e}")
