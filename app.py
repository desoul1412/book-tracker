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
        width: 100%; border: none !important; background: transparent !important;
        color: #2d3748 !important; font-weight: 800 !important; font-size: 15px !important;
    }
    .book-header {
        background-color: #5b8aed; color: white; padding: 15px; text-align: center;
        font-weight: bold; font-size: 24px; border-radius: 8px 8px 0 0;
    }
    button[kind="primary"] { background-color: #5b8aed !important; color: white !important; }
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
    # --- ADD BOOK FORM (DIRECT SYNC) ---
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
                    
                    # Mapping based on your provided list
                    mapping = {
                        "Timestamp": str(datetime.now()),
                        "Author": new_author,
                        "Title": new_title,
                        "Reading Status": new_status,
                        "Cover URL": new_cover
                    }
                    
                    for i, h in enumerate(headers):
                        if h.strip() in mapping:
                            new_row[i] = mapping[h.strip()]
                    
                    ws.append_row(new_row)
                    st.toast("✅ Added to Sheet!")
                    st.rerun() # Refresh to show on web instantly
                except Exception as e:
                    st.error(f"Failed to add: {e}")

# --- MAIN APP ---
if 'sheet_conn' in st.session_state:
    try:
        ws = st.session_state['sheet_conn'].worksheet("Form Responses")
        
        # Pull raw values to bypass duplicate header error
        raw_data = ws.get_all_values()
        if not raw_data: st.stop()
        
        header_row = raw_data[0]
        # Handle empty/duplicate headers in Python
        clean_header = [h.strip() if h.strip() else f"EMPTY_{i}" for i, h in enumerate(header_row)]
        df = pd.DataFrame(raw_data[1:], columns=clean_header)

        col_map = {
            "Title": "Title", "Author": "Author", "Status": "Reading Status",
            "Cover": "Cover URL", "Rating": "Rating", "Review": "Reviews",
            "Timestamp": "Timestamp"
        }

        # Filter out empty rows and map index
        df = df[df[col_map["Title"]].astype(str).str.strip() != ""]
        df['real_row_index'] = df.index + 2

        # --- GRID DISPLAY ---
        st.write(f"**Showing {len(df)} books**")
        grid = st.columns(5)

        @st.dialog("Book Details", width="large")
        def show_modal(row):
            st.markdown("<div class='book-header'>BOOK VIEW</div>", unsafe_allow_html=True)
            c1, c2 = st.columns([1, 1.5], gap="large")
            with c1:
                st.subheader(row[col_map["Title"]])
                st.image(row.get(col_map["Cover"]) or "https://via.placeholder.com/300", use_container_width=True)
                
                # Dynamic Star Feedback
                rating_count = str(row[col_map["Rating"]]).count('★')
                new_stars = st.feedback("stars", key=f"s_{row['real_row_index']}")
                final_stars = (new_stars + 1) if new_stars is not None else rating_count
                
                new_stat = st.selectbox("Status", ["To Read", "Reading", "Read", "DNF"], 
                                        index=["To Read", "Reading", "Read", "DNF"].index(row[col_map["Status"]]) if row[col_map["Status"]] in ["To Read", "Reading", "Read", "DNF"] else 0)
            with c2:
                new_rev = st.text_area("Reviews", value=row[col_map["Review"]], height=200)
                if st.button("💾 Save Changes", type="primary"):
                    # Dynamic column indexing
                    h_list = [h.strip() for h in header_row]
                    ws.update_cell(int(row['real_row_index']), h_list.index(col_map["Status"])+1, new_stat)
                    ws.update_cell(int(row['real_row_index']), h_list.index(col_map["Rating"])+1, "★" * final_stars)
                    ws.update_cell(int(row['real_row_index']), h_list.index(col_map["Review"])+1, new_rev)
                    st.toast("Saved!"); st.rerun()

        # Render Grid
        for i, (idx, row) in enumerate(df.iterrows()):
            with grid[i % 5]:
                st.image(row.get(col_map["Cover"]) or "https://via.placeholder.com/300", use_container_width=True)
                if st.button(row[col_map["Title"]], key=f"btn_{idx}"): show_modal(row)

    except Exception as e: st.error(f"Sync Error: {e}")
