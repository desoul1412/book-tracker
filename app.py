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
    div[data-testid="stImage"] img {
        height: 300px !important;
        object-fit: cover !important;
        border-radius: 8px;
        width: 100% !important;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    div[data-testid="stButton"] button {
        width: 100%;
        border: none !important;
        background: transparent !important;
        color: #2d3748 !important;
        font-weight: 800 !important;
        font-size: 15px !important;
        text-align: center !important;
    }
    div[data-testid="stButton"] button:hover { color: #5b8aed !important; }
    .book-header {
        background-color: #5b8aed; color: white; padding: 15px; text-align: center;
        font-weight: bold; font-size: 24px; border-radius: 8px 8px 0 0; text-transform: uppercase;
    }
    button[kind="primary"] { background-color: #5b8aed !important; color: white !important; }
    button[kind="secondary"] { border-color: #fc8181 !important; color: #c53030 !important; }
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
    except Exception as e:
        return None, str(e)

# --- SIDEBAR ---
st.sidebar.title("📚 My Book Shelf")

if 'sheet_conn' not in st.session_state:
    st.sidebar.info(f"Share Sheet with (Editor): {bot_email}")
    sheet_url = st.sidebar.text_input("Paste Sheet URL:")
    if st.sidebar.button("Connect Library", type="primary"):
        sheet, err = connect_to_sheet(sheet_url)
        if sheet:
            st.session_state['sheet_conn'] = sheet
            st.rerun()
        else:
            st.sidebar.error(err)
else:
    # --- ADD BOOK ---
    with st.sidebar.expander("➕ Add Book", expanded=False):
        with st.form("add_book_form", clear_on_submit=True):
            new_title = st.text_input("Title *")
            new_author = st.text_input("Author *")
            new_cover = st.text_input("Cover URL")
            new_status = st.selectbox("Status", ["To Read", "Reading", "Read", "DNF"])
            if st.form_submit_button("Add", type="primary"):
                try:
                    ws = st.session_state['sheet_conn'].worksheet("Form Responses")
                    headers = ws.row_values(1)
                    new_row = [""] * len(headers)
                    mapping = {"Timestamp": str(datetime.now()), "Author": new_author, "Title": new_title, "Reading Status": new_status, "Cover URL": new_cover}
                    for i, h in enumerate(headers):
                        if h in mapping: new_row[i] = mapping[h]
                    ws.append_row(new_row)
                    st.toast("✅ Book Added!")
                    st.rerun()
                except Exception as e: st.error(f"Error: {e}")

# --- MAIN APP ---
if 'sheet_conn' in st.session_state:
    try:
        ws = st.session_state['sheet_conn'].worksheet("Form Responses")
        data = ws.get_all_records()
        df = pd.DataFrame(data)
        
        col_map = {
            "Title": "Title", "Author": "Author", "Status": "Reading Status",
            "Cover": "Cover URL", "Rating": "Rating", "Source": "Source",
            "Primary": "Primary Genre", "Secondary": "Secondary Genre(s)",
            "Tropes": "Tropes", "Owned": "Owned?", "Review": "Reviews",
            "Series": "Series Name", "SeriesNum": "Number in Series", "Timestamp": "Timestamp"
        }

        df = df[df[col_map["Title"]].astype(str).str.strip() != ""]
        df['real_row_index'] = df.index + 2

        # --- FILTERS (RESTORED) ---
        st.sidebar.markdown("---")
        st.sidebar.subheader("🔍 Filters")
        filtered_df = df.copy()

        def add_split_filter(label, col_name):
            if col_name in df.columns:
                # Splits comma-separated values into unique single tags
                items = df[col_name].astype(str).str.split(',').explode().str.strip()
                unique_items = sorted([x for x in items.unique() if x and x.lower() != 'nan'])
                return st.sidebar.multiselect(label, unique_items)
            return []

        f_status = st.sidebar.multiselect("Reading Status", sorted(df[col_map["Status"]].unique()))
        f_source = st.sidebar.multiselect("Source", sorted(df[col_map["Source"]].unique()))
        f_owned = st.sidebar.multiselect("Owned?", sorted(df[col_map["Owned"]].unique()))
        f_primary = add_split_filter("Primary Genre", col_map["Primary"])
        f_secondary = add_split_filter("Secondary Genre(s)", col_map["Secondary"])
        f_tropes = add_split_filter("Tropes", col_map["Tropes"])

        if f_status: filtered_df = filtered_df[filtered_df[col_map["Status"]].isin(f_status)]
        if f_source: filtered_df = filtered_df[filtered_df[col_map["Source"]].isin(f_source)]
        if f_owned: filtered_df = filtered_df[filtered_df[col_map["Owned"]].isin(f_owned)]
        
        # Split matching for Genres/Tropes
        for f_list, col in [(f_primary, col_map["Primary"]), (f_secondary, col_map["Secondary"]), (f_tropes, col_map["Tropes"])]:
            if f_list:
                pat = '|'.join(f_list)
                filtered_df = filtered_df[filtered_df[col].astype(str).str.contains(pat, case=False, na=False)]

        # --- SEARCH & SORT ---
        col_s1, col_s2 = st.columns([2, 1])
        with col_s1:
            search = st.text_input("🔍 Search Title or Author", placeholder="Type to search...")
            if search:
                filtered_df = filtered_df[filtered_df[col_map["Title"]].str.contains(search, case=False) | filtered_df[col_map["Author"]].str.contains(search, case=False)]
        with col_s2:
            sort_opt = st.selectbox("Sort By:", ["Newest Added", "Title (A to Z)", "Title (Z to A)"])
            if "A to Z" in sort_opt: filtered_df = filtered_df.sort_values(col_map["Title"])
            elif "Z to A" in sort_opt: filtered_df = filtered_df.sort_values(col_map["Title"], ascending=False)
            else: filtered_df = filtered_df.sort_values(col_map["Timestamp"], ascending=False)

        # --- MODAL ---
        @st.dialog("Book Details", width="large")
        def show_modal(row):
            st.markdown("<div class='book-header'>BOOK VIEW</div>", unsafe_allow_html=True)
            c1, c2 = st.columns([1, 1.5], gap="large")
            with c1:
                st.subheader(row[col_map["Title"]])
                st.write(f"*{row[col_map['Author']]}*")
                st.image(row.get(col_map["Cover"]) or "https://via.placeholder.com/300", use_container_width=True)
                st.write("Rating")
                rating_val = str(row[col_map["Rating"]]).count('★')
                new_rating = st.feedback("stars", key=f"stars_{row['real_row_index']}")
                final_stars = (new_rating + 1) if new_rating is not None else rating_val
                new_stat = st.selectbox("Status", ["To Read", "Reading", "Read", "DNF"], index=["To Read", "Reading", "Read", "DNF"].index(row[col_map["Status"]]) if row[col_map["Status"]] in ["To Read", "Reading", "Read", "DNF"] else 0)
            with c2:
                new_p = st.text_area("Primary Genre", value=row[col_map["Primary"]])
                new_s = st.text_area("Secondary Genre(s)", value=row[col_map["Secondary"]])
                new_t = st.text_area("Tropes", value=row[col_map["Tropes"]])
                new_rev = st.text_area("Reviews", value=row[col_map["Review"]], height=150)
            col_del, col_save = st.columns(2)
            if col_del.button("🗑️ Remove Book", type="secondary"):
                ws.delete_rows(int(row['real_row_index']))
                st.toast("Deleted!"); st.rerun()
            if col_save.button("💾 Save Changes", type="primary"):
                headers = ws.row_values(1)
                def up(c, v):
                    try: ws.update_cell(int(row['real_row_index']), headers.index(c)+1, v)
                    except: pass
                up(col_map["Status"], new_stat); up(col_map["Rating"], "★" * final_stars)
                up(col_map["Primary"], new_p); up(col_map["Secondary"], new_s)
                up(col_map["Tropes"], new_t); up(col_map["Review"], new_rev)
                st.toast("Saved!"); st.rerun()

        # --- GRID ---
        st.write(f"**Showing {len(filtered_df)} books**")
        grid = st.columns(5)
        for i, (idx, row) in enumerate(filtered_df.iterrows()):
            with grid[i % 5]:
                st.image(row.get(col_map["Cover"]) or "https://via.placeholder.com/300", use_container_width=True)
                if st.button(row[col_map["Title"]], key=f"g_{idx}"): show_modal(row)
    except Exception as e: st.error(f"Error: {e}")
