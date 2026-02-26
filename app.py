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
    .book-header {
        background-color: #5b8aed;
        color: white;
        padding: 15px;
        text-align: center;
        font-weight: bold;
        font-size: 24px;
        border-radius: 8px 8px 0 0;
        text-transform: uppercase;
    }
    button[kind="primary"] {
        background-color: #5b8aed !important;
        color: white !important;
    }
    .css-15zrgzn {display: none}
    div[data-testid="stFeedback"] { justify-content: center; }
</style>
""", unsafe_allow_html=True)

# --- AUTH SETUP ---
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
                    
                    mapping = {
                        "Timestamp": str(datetime.now()),
                        "Author": new_author,
                        "Title": new_title,
                        "Reading Status": new_status,
                        "Cover URL": new_cover
                    }
                    
                    for i, h in enumerate(headers):
                        if h in mapping:
                            new_row[i] = mapping[h]
                    
                    ws.append_row(new_row)
                    st.toast("✅ Book Added!")
                    st.rerun()
                except Exception as e:
                    st.error(f"Error: {e}")

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
            "Series": "Series Name", "SeriesNum": "Number in Series",
            "Timestamp": "Timestamp"
        }

        df = df[df[col_map["Title"]].astype(str).str.strip() != ""]
        df['real_row_index'] = df.index + 2

        # --- FILTERS & SORTING ---
        st.sidebar.markdown("---")
        filtered_df = df.copy()
        
        search = st.text_input("🔍 Search Title or Author")
        if search:
            filtered_df = filtered_df[
                filtered_df[col_map["Title"]].str.contains(search, case=False) |
                filtered_df[col_map["Author"]].str.contains(search, case=False)
            ]

        # --- MODAL DIALOG ---
        @st.dialog("Book Details", width="large")
        def show_modal(row):
            st.markdown("<div class='book-header'>BOOK VIEW</div>", unsafe_allow_html=True)
            c1, c2 = st.columns([1, 1.5], gap="large")
            with c1:
                st.subheader(row[col_map["Title"]])
                st.write(f"*{row[col_map['Author']]}*")
                img = row.get(col_map["Cover"]) or "https://via.placeholder.com/300"
                st.image(img, use_container_width=True)
                
                # Fixed Star Logic
                st.write("Rating")
                rating_val = str(row[col_map["Rating"]]).count('★')
                new_rating = st.feedback("stars", key=f"stars_{row['real_row_index']}")
                
                # Clean selection logic
                final_stars = rating_val
                if new_rating is not None:
                    final_stars = new_rating + 1
                
                new_stat = st.selectbox("Status", ["To Read", "Reading", "Read", "DNF"], 
                                        index=["To Read", "Reading", "Read", "DNF"].index(row[col_map["Status"]]) if row[col_map["Status"]] in ["To Read", "Reading", "Read", "DNF"] else 0)

            with c2:
                new_p = st.text_area("Primary Genre", value=row[col_map["Primary"]])
                new_s = st.text_area("Secondary Genre(s)", value=row[col_map["Secondary"]])
                new_t = st.text_area("Tropes", value=row[col_map["Tropes"]])
                new_rev = st.text_area("Reviews", value=row[col_map["Review"]], height=150)

            col_del, col_save = st.columns(2)
            if col_del.button("🗑️ Remove Book"):
                ws.delete_rows(int(row['real_row_index']))
                st.toast("Deleted!")
                st.rerun()
                
            if col_save.button("💾 Save Changes", type="primary"):
                r_idx = int(row['real_row_index'])
                # Helper to find column letters/indices
                headers = ws.row_values(1)
                
                def update_ws(col_name, val):
                    try:
                        c_idx = headers.index(col_name) + 1
                        ws.update_cell(r_idx, c_idx, val)
                    except: pass

                update_ws(col_map["Status"], new_stat)
                update_ws(col_map["Rating"], "★" * final_stars)
                update_ws(col_map["Primary"], new_p)
                update_ws(col_map["Secondary"], new_s)
                update_ws(col_map["Tropes"], new_t)
                update_ws(col_map["Review"], new_rev)
                
                st.toast("Saved!")
                st.rerun()

        # --- GRID VIEW ---
        st.write(f"**Showing {len(filtered_df)} books**")
        grid_cols = st.columns(5)
        for i, (idx, row) in enumerate(filtered_df.iterrows()):
            with grid_cols[i % 5]:
                img = row.get(col_map["Cover"]) or "https://via.placeholder.com/300"
                st.image(img, use_container_width=True)
                if st.button(row[col_map["Title"]], key=f"grid_{idx}"):
                    show_modal(row)

    except Exception as e:
        st.error(f"Error loading sheet: {e}")
