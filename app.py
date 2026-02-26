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
    /* 1. UNIFORM COVERS & GRID ALIGNMENT */
    div[data-testid="stImage"] img {
        height: 300px !important;
        object-fit: cover !important;
        border-radius: 8px;
        width: 100% !important;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    /* 2. BOLD CENTERED TITLES AS BUTTONS */
    div[data-testid="stButton"] button {
        width: 100%; border: none !important; background: transparent !important;
        color: #2d3748 !important; font-weight: 800 !important;
        font-size: 15px !important; text-align: center !important;
    }
    div[data-testid="stButton"] button:hover { color: #5b8aed !important; }
    /* 3. WIDE MODAL BLUE HEADER */
    .book-header {
        background-color: #5b8aed; color: white; padding: 15px; text-align: center;
        font-weight: bold; font-size: 24px; border-radius: 8px 8px 0 0; text-transform: uppercase;
    }
    /* 4. UI BUTTONS */
    button[kind="primary"] { background-color: #5b8aed !important; color: white !important; }
    button[kind="secondary"] { border-color: #fc8181 !important; color: #c53030 !important; }
    /* 5. CLEANUP */
    .css-15zrgzn {display: none}
    div[data-testid="stFeedback"] { justify-content: center; }
</style>
""", unsafe_allow_html=True)

# --- AUTH & CONNECTION ---
creds_dict = st.secrets["gcp_service_account"] if "gcp_service_account" in st.secrets else None
bot_email = creds_dict["client_email"] if creds_dict else "Unavailable"

def connect_to_sheet(sheet_url):
    try:
        scope = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
        creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, scope)
        client = gspread.authorize(creds)
        sheet = client.open_by_url(sheet_url)
        return sheet, None
    except Exception as e: return None, str(e)

# --- SIDEBAR ---
st.sidebar.title("📚 My Book Shelf")

if 'sheet_conn' not in st.session_state:
    st.sidebar.info(f"**Step 1:** Share Sheet with (Editor): {bot_email}")
    sheet_url = st.sidebar.text_input("**Step 2:** Paste Sheet URL:")
    if st.sidebar.button("Connect Library", type="primary"):
        sheet, err = connect_to_sheet(sheet_url)
        if sheet: st.session_state['sheet_conn'] = sheet; st.rerun()
        else: st.sidebar.error(err)
else:
    # --- ADD BOOK (Live Sync) ---
    with st.sidebar.expander("➕ Add New Book", expanded=False):
        with st.form("add_book_form", clear_on_submit=True):
            n_title = st.text_input("Book Name *")
            n_author = st.text_input("Author *")
            n_cover = st.text_input("Cover URL")
            n_status = st.selectbox("Status", ["To Read", "Reading", "Read", "DNF"])
            if st.form_submit_button("Add Book", type="primary"):
                try:
                    ws = st.session_state['sheet_conn'].worksheet("Form Responses")
                    headers = ws.row_values(1)
                    new_row = [""] * len(headers)
                    # Strict mapping for the "Add" function
                    mapping = {"Timestamp": str(datetime.now()), "Author": n_author, "Title": n_title, "Reading Status": n_status, "Cover URL": n_cover}
                    for i, h in enumerate(headers):
                        if h.strip() in mapping: new_row[i] = mapping[h.strip()]
                    ws.append_row(new_row)
                    st.toast("✅ Added to Shelf!"); st.rerun()
                except Exception as e: st.error(f"Error: {e}")

# --- MAIN APP ---
if 'sheet_conn' in st.session_state:
    try:
        ws = st.session_state['sheet_conn'].worksheet("Form Responses")
        raw_data = ws.get_all_values()
        if not raw_data: st.stop()
        
        # Robust Header Handling
        header_row = [h.strip() for h in raw_data[0]]
        clean_header = [h if h else f"COL_{i}" for i, h in enumerate(header_row)]
        df = pd.DataFrame(raw_data[1:], columns=clean_header)

        # Map strictly to your 20 columns
        col_map = {
            "T": "Title", "A": "Author", "S": "Reading Status", "C": "Cover URL", 
            "R": "Rating", "Src": "Source", "P": "Primary Genre", "Sec": "Secondary Genre(s)",
            "Tr": "Tropes", "O": "Owned?", "Rev": "Reviews", "F": "Format", "D": "Date Finished",
            "Sn": "Series Name", "S#": "Number in Series", "Time": "Timestamp"
        }

        df = df[df[col_map["T"]].astype(str).str.strip() != ""]
        df['real_row_index'] = df.index + 2

        # --- TABS ---
        tab_shelf, tab_future = st.tabs(["My Book Shelf", "Future Tab"])

        with tab_shelf:
            # --- FILTERS & SORTING ---
            st.sidebar.markdown("---")
            st.sidebar.subheader("🔍 Filters")
            filtered_df = df.copy()

            def split_filter(label, col):
                if col in df.columns:
                    items = df[col].astype(str).str.split(',').explode().str.strip()
                    unique = sorted([x for x in items.unique() if x and x.lower() != 'nan'])
                    return st.sidebar.multiselect(label, unique)
                return []

            f_stat = st.sidebar.multiselect("Reading Status", sorted(df[col_map["S"]].unique()))
            f_src = st.sidebar.multiselect("Source", sorted(df[col_map["Src"]].unique()) if col_map["Src"] in df.columns else [])
            f_own = st.sidebar.multiselect("Owned?", sorted(df[col_map["O"]].unique()) if col_map["O"] in df.columns else [])
            f_pri = split_filter("Primary Genre", col_map["P"])
            f_sec = split_filter("Secondary Genre(s)", col_map["Sec"])
            f_trp = split_filter("Tropes", col_map["Tr"])

            # Apply logic
            if f_stat: filtered_df = filtered_df[filtered_df[col_map["S"]].isin(f_stat)]
            if f_src: filtered_df = filtered_df[filtered_df[col_map["Src"]].isin(f_src)]
            if f_own: filtered_df = filtered_df[filtered_df[col_map["O"]].isin(f_own)]
            for f_list, col in [(f_pri, col_map["P"]), (f_sec, col_map["Sec"]), (f_trp, col_map["Tr"])]:
                if f_list and col in df.columns:
                    pat = '|'.join([f"^{x}$|^{x},|, {x},|, {x}$" for x in f_list])
                    filtered_df = filtered_df[filtered_df[col].astype(str).str.contains(pat, case=False, na=False)]

            # --- SEARCH & SORT ---
            s1, s2 = st.columns([2, 1])
            with s1:
                all_titles = sorted(df[col_map["T"]].unique().tolist())
                search_choice = st.selectbox("🔍 Search Book (Autocomplete):", [""] + all_titles)
                if search_choice: filtered_df = filtered_df[filtered_df[col_map["T"]] == search_choice]
            with s2:
                sort_opt = st.selectbox("Sort By:", ["Newest Added", "Title (A-Z)", "Title (Z-A)", "Rating (High-Low)"])
                if "A-Z" in sort_opt: filtered_df = filtered_df.sort_values(col_map["T"])
                elif "Z-A" in sort_opt: filtered_df = filtered_df.sort_values(col_map["T"], ascending=False)
                elif "Rating" in sort_opt: 
                    filtered_df['_r'] = filtered_df[col_map["R"]].str.count('★')
                    filtered_df = filtered_df.sort_values('_r', ascending=False)
                else: filtered_df = filtered_df.sort_values(col_map["Time"], ascending=False)

            # --- GRID & MODAL ---
            st.write(f"**Showing {len(filtered_df)} books**")
            
            @st.dialog("Book Details", width="large")
            def show_modal(row):
                st.markdown("<div class='book-header'>BOOK VIEW</div>", unsafe_allow_html=True)
                c1, c2 = st.columns([1, 1.5], gap="large")
                with c1:
                    st.subheader(row[col_map["T"]])
                    st.write(f"*{row[col_map['A']]}*")
                    st.write(f"Series: {row.get(col_map['Sn'], '')} #{row.get(col_map['S#'], '')}")
                    st.image(row.get(col_map["C"]) or "https://via.placeholder.com/300", use_container_width=True)
                    st.write("Rating")
                    r_val = str(row[col_map["R"]]).count('★')
                    new_r = st.feedback("stars", key=f"s_{row['real_row_index']}")
                    final_r = (new_r + 1) if new_r is not None else r_val
                    new_st = st.selectbox("Status", ["To Read", "Reading", "Read", "DNF"], 
                                          index=["To Read", "Reading", "Read", "DNF"].index(row[col_map["S"]]) if row[col_map["S"]] in ["To Read", "Reading", "Read", "DNF"] else 0)
                with c2:
                    r1, r2 = st.columns(2)
                    new_date = r1.text_input("Date Finished", value=row.get(col_map["D"], ""))
                    new_own = r2.text_input("Owned?", value=row.get(col_map["O"], ""))
                    r3, r4 = st.columns(2)
                    new_fmt = r3.text_input("Format", value=row.get("Format", ""))
                    new_src = r4.text_input("Source", value=row.get(col_map["Src"], ""))
                    new_p = st.text_area("Primary Genre", value=row.get(col_map["P"], ""), height=70)
                    new_s = st.text_area("Secondary Genre", value=row.get(col_map["Sec"], ""), height=70)
                    new_t = st.text_area("Tropes", value=row.get(col_map["Tr"], ""), height=70)
                    new_rev = st.text_area("My Review", value=row.get(col_map["Rev"], ""), height=150)
                    
                    cd, cs = st.columns(2)
                    if cd.button("🗑️ Remove Book", type="secondary"):
                        ws.delete_rows(int(row['real_row_index'])); st.toast("Deleted!"); st.rerun()
                    if cs.button("💾 Save Changes", type="primary"):
                        h_list = [h.strip() for h in header_row]
                        def up(c, v): 
                            if c in h_list: ws.update_cell(int(row['real_row_index']), h_list.index(c)+1, v)
                        up(col_map["S"], new_st); up(col_map["R"], "★" * final_r)
                        up(col_map["Rev"], new_rev); up(col_map["D"], new_date)
                        up(col_map["O"], new_own); up(col_map["Src"], new_src)
                        up(col_map["P"], new_p); up(col_map["Sec"], new_s); up(col_map["Tr"], new_t)
                        st.toast("Saved!"); st.rerun()

            grid = st.columns(5)
            for i, (idx, row) in enumerate(filtered_df.iterrows()):
                with grid[i % 5]:
                    st.image(row.get(col_map["C"]) or "https://via.placeholder.com/300", use_container_width=True)
                    if st.button(row[col_map["T"]], key=f"b_{idx}"): show_modal(row)

    except Exception as e: st.error(f"Sync Error: {e}")
