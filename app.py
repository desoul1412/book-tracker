import streamlit as st
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import pandas as pd
from datetime import datetime

# --- CONFIG ---
st.set_page_config(page_title="My Book Shelf", layout="wide", page_icon="📚")

# --- CUSTOM CSS (Grid & Visuals) ---
st.markdown("""
<style>
    div[data-testid="stImage"] img { height: 300px !important; object-fit: cover !important; border-radius: 8px; width: 100% !important; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    div[data-testid="stButton"] button { width: 100%; border: none !important; background: transparent !important; color: #2d3748 !important; font-weight: 800 !important; font-size: 15px !important; text-align: center !important; }
    .book-header { background-color: #5b8aed; color: white; padding: 15px; text-align: center; font-weight: bold; font-size: 24px; border-radius: 8px 8px 0 0; text-transform: uppercase; }
    button[kind="primary"] { background-color: #5b8aed !important; color: white !important; font-weight: bold !important; }
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
    # --- ADD BOOK (FIXED SYNC) ---
    with st.sidebar.expander("➕ Add New Book", expanded=False):
        with st.form("add_book_form", clear_on_submit=True):
            n_title = st.text_input("Book Name *")
            n_author = st.text_input("Author *")
            n_cover = st.text_input("Cover URL")
            n_status = st.selectbox("Status", ["To Read", "Reading", "Read", "DNF"])
            
            if st.form_submit_button("Add Book", type="primary"):
                if not n_title or not n_author:
                    st.error("Please fill in Title and Author.")
                else:
                    try:
                        # Explicitly target the sheet
                        ws = st.session_state['sheet_conn'].worksheet("Form Responses")
                        headers = [h.strip() for h in ws.row_values(1)]
                        new_row = [""] * len(headers)
                        
                        # Direct mapping
                        mapping = {
                            "Timestamp": datetime.now().strftime("%m/%d/%Y %H:%M:%S"),
                            "Author": n_author,
                            "Title": n_title,
                            "Reading Status": n_status,
                            "Cover URL": n_cover
                        }
                        
                        for i, h in enumerate(headers):
                            if h in mapping:
                                new_row[i] = mapping[h]
                        
                        # Use insert_row for better consistency in real-time
                        ws.insert_row(new_row, 2) 
                        st.toast("🎉 Book added successfully!")
                        st.success(f"Added '{n_title}' to your shelf!")
                        st.rerun()
                    except Exception as e:
                        st.error(f"Sync Error: {e}")

# --- MAIN CONTENT ---
if 'sheet_conn' in st.session_state:
    try:
        ws = st.session_state['sheet_conn'].worksheet("Form Responses")
        raw_data = ws.get_all_values()
        if not raw_data: st.stop()
        
        # Pull data live without caching
        header_row = [h.strip() for h in raw_data[0]]
        clean_header = [h if h else f"EMPTY_{i}" for i, h in enumerate(header_row)]
        df = pd.DataFrame(raw_data[1:], columns=clean_header)

        # Map to your exact 20 columns
        col_map = {
            "T": "Title", "A": "Author", "S": "Reading Status", "C": "Cover URL", 
            "R": "Rating", "Src": "Source", "P": "Primary Genre", "Sec": "Secondary Genre(s)",
            "Tr": "Tropes", "O": "Owned?", "Rev": "Reviews", "F": "Format", "D": "Date Finished",
            "Sn": "Series Name", "S#": "Number in Series", "Time": "Timestamp"
        }

        df = df[df[col_map["T"]].astype(str).str.strip() != ""]
        df['real_row_index'] = df.index + 2

        # --- FILTERS & GRID ---
        tab_shelf, _ = st.tabs(["My Book Shelf", "Future"])
        with tab_shelf:
            # Grid setup
            st.write(f"**Showing {len(df)} books**")
            
            # Simple sorting by Newest Added
            df_display = df.sort_values(col_map["Time"], ascending=False)
            
            grid = st.columns(5)
            for i, (idx, row) in enumerate(df_display.iterrows()):
                with grid[i % 5]:
                    st.image(row.get(col_map["C"]) or "https://via.placeholder.com/300", use_container_width=True)
                    if st.button(row[col_map["T"]], key=f"b_{idx}"):
                        # Call your Modal logic here...
                        pass

    except Exception as e: st.error(f"Error loading shelf: {e}")
