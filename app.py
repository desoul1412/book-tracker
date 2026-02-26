import streamlit as st
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import pandas as pd
from datetime import datetime

# --- CONFIG ---
st.set_page_config(page_title="My Book Shelf", layout="wide", page_icon="📚")

# --- CSS FOR STYLING (To match your Blue Header look) ---
st.markdown("""
<style>
    .book-header {
        background-color: #5b8aed;
        color: white;
        padding: 10px;
        text-align: center;
        font-weight: bold;
        font-size: 24px;
        border-radius: 5px 5px 0 0;
        margin-bottom: 20px;
    }
    .stButton button {
        width: 100%;
    }
</style>
""", unsafe_allow_html=True)

# --- AUTH & CONNECTION ---
# Check if secrets exist (Streamlit Cloud) or use local file logic if you prefer
try:
    if "gcp_service_account" in st.secrets:
        creds_dict = dict(st.secrets["gcp_service_account"])
    else:
        # Fallback for local testing if you haven't set up secrets yet
        import json
        with open(".streamlit/secrets.toml") as f:
            # logic to read toml or just load json directly if you have it
            pass 
except:
    pass # We will rely on the BOT_EMAIL from previous steps if secrets work

def connect_to_sheet(sheet_url):
    try:
        scope = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
        # Load from Streamlit Secrets
        creds = ServiceAccountCredentials.from_json_keyfile_dict(dict(st.secrets["gcp_service_account"]), scope)
        client = gspread.authorize(creds)
        sheet = client.open_by_url(sheet_url)
        return sheet, None
    except Exception as e:
        return None, str(e)

# --- SIDEBAR: CONNECT & ADD BOOK ---
st.sidebar.title("📚 Library Manager")

# 1. CONNECTION SECTION
if 'sheet_conn' not in st.session_state:
    st.sidebar.markdown("### 🔌 Connect")
    sheet_url = st.sidebar.text_input("Paste Google Sheet URL:", placeholder="https://docs.google.com/...")
    if st.sidebar.button("Connect Library"):
        if sheet_url:
            sheet, error = connect_to_sheet(sheet_url)
            if sheet:
                st.session_state['sheet_conn'] = sheet
                st.session_state['sheet_url'] = sheet_url
                st.rerun()
            else:
                st.sidebar.error(f"Connection Failed: {error}")
else:
    if st.sidebar.button("🔄 Refresh Data"):
        st.cache_data.clear()
        st.rerun()

# 2. ADD NEW BOOK SECTION
if 'sheet_conn' in st.session_state:
    st.sidebar.markdown("---")
    with st.sidebar.expander("➕ Add New Book", expanded=False):
        with st.form("add_book_form"):
            new_title = st.text_input("Title *")
            new_author = st.text_input("Author *")
            new_cover = st.text_input("Cover URL")
            new_status = st.selectbox("Status", ["To Read", "Reading", "Read", "DNF"])
            
            submitted = st.form_submit_button("Add to Shelf")
            if submitted and new_title and new_author:
                try:
                    sheet = st.session_state['sheet_conn']
                    ws = sheet.worksheet("Form Responses")
                    
                    # APPEND ROW (We map basic fields, leave others empty)
                    # Assuming columns: [Timestamp, Author, Title, Series, ..., Status(Col 10), ..., Cover(Col 16)]
                    # We create a generic list and fill specific spots. 
                    # NOTE: This assumes your sheet has at least 20 columns.
                    new_row = [""] * 20 
                    new_row[0] = str(datetime.now()) # Timestamp
                    new_row[1] = new_author          # Col B
                    new_row[2] = new_title           # Col C
                    new_row[9] = new_status          # Col J (Index 9)
                    new_row[15] = new_cover          # Col P (Index 15)
                    
                    ws.append_row(new_row)
                    st.success("Book Added!")
                    st.cache_data.clear() # Force reload
                except Exception as e:
                    st.error(f"Error adding book: {e}")

# --- MAIN APP LOGIC ---
if 'sheet_conn' in st.session_state:
    try:
        sheet = st.session_state['sheet_conn']
        ws = sheet.worksheet("Form Responses")
        
        # FETCH DATA
        data = ws.get_all_records()
        df = pd.DataFrame(data)

        # --- DATA CLEANING (CRITICAL FIX) ---
        # 1. Drop rows where 'Title' is missing or empty string
        df = df[df['Title'].astype(str).str.strip() != '']
        
        # 2. Add a 'real_row_index' so we edit the correct row later
        # (Google Sheets is 1-indexed, +1 for header = start at 2)
        df['real_row_index'] = range(2, len(df) + 2)

        st.title(f"📖 {sheet.title}")

        # --- SEARCH & FILTERS ---
        col_search, col_filter = st.columns([2, 1])
        
        with col_search:
            # Search Bar with Suggestions
            all_titles = df['Title'].tolist()
            search_choice = st.selectbox("🔍 Search Book:", [""] + all_titles, index=0)

        with col_filter:
            # Filter Logic (Hidden inside expander to save space or sidebar)
            filter_status = st.multiselect("Filter Status:", df['Status'].unique())

        # APPLY FILTERS
        filtered_df = df.copy()
        if search_choice:
            filtered_df = filtered_df[filtered_df['Title'] == search_choice]
        if filter_status:
            filtered_df = filtered_df[filtered_df['Status'].isin(filter_status)]

        # --- GRID DISPLAY ---
        if not filtered_df.empty:
            cols = st.columns(5)
            for idx, row in filtered_df.iterrows():
                col = cols[idx % 5]
                with col:
                    # Robust Image Check
                    img_url = str(row.get('Cover URL', '')).strip()
                    if len(img_url) < 5 or not img_url.startswith('http'):
                        img_url = "https://via.placeholder.com/150?text=No+Cover"
                    
                    st.image(img_url, use_container_width=True)
                    
                    # CLICK TO OPEN MODAL
                    if st.button(f"📘 {row['Title']}", key=f"btn_{row['real_row_index']}"):
                        st.session_state['selected_book'] = row
                        st.session_state['show_modal'] = True
                        st.rerun()

        # --- THE MODAL (EDIT BOOK) ---
        if st.session_state.get('show_modal') and 'selected_book' in st.session_state:
            book = st.session_state['selected_book']
            
            @st.dialog(f"Book View: {book['Title']}")
            def show_edit_modal():
                # HEADER
                st.markdown(f"<div class='book-header'>BOOK VIEW</div>", unsafe_allow_html=True)
                
                # LAYOUT: LEFT (Image/Core) vs RIGHT (Details)
                c1, c2 = st.columns([1, 2])
                
                with c1:
                    # Cover Image
                    img_url = str(book.get('Cover URL', '')).strip()
                    if len(img_url) > 5:
                        st.image(img_url, use_container_width=True)
                    
                    st.markdown("---")
                    
                    # Core Fields
                    new_title = st.text_input("Title", value=book['Title'])
                    new_author = st.text_input("Author", value=book['Author'])
                    
                    # Series logic
                    c_s1, c_s2 = st.columns([1, 2])
                    new_series_num = c_s1.text_input("#", value=str(book.get('Series #','')))
                    new_series = c_s2.text_input("Series", value=book.get('Series Name',''))
                    
                    # Rating (Star Input simulation)
                    curr_rating = book.get('Rating', 0)
                    # Convert '★★★★' string to int if necessary, or just use number
                    if isinstance(curr_rating, str) and '★' in curr_rating:
                        curr_rating = len(curr_rating)
                    elif not str(curr_rating).isdigit():
                        curr_rating = 0
                    new_rating = st.slider("Rating", 0, 5, int(curr_rating))
                    
                    # Status
                    status_opts = ["To Read", "Reading", "Read", "DNF"]
                    curr_stat = book.get('Status', 'To Read')
                    new_status = st.selectbox("Status", status_opts, index=status_opts.index(curr_stat) if curr_stat in status_opts else 0)

                with c2:
                    # ROW 1
                    r1c1, r1c2 = st.columns(2)
                    new_date = r1c1.text_input("Date Finished", value=str(book.get('Date Finished','')))
                    new_owned = r1c2.selectbox("Owned?", ["Yes", "No"], index=0 if book.get('Owned') == "Yes" else 1)
                    
                    # ROW 2
                    r2c1, r2c2 = st.columns(2)
                    new_fmt = r2c1.text_input("Format", value=book.get('Format',''))
                    new_src = r2c2.text_input("Source", value=book.get('Source',''))
                    
                    # ROW 3 (Genres)
                    new_prime = st.text_area("Primary Genre", value=book.get('Primary Genre',''), height=68)
                    new_second = st.text_area("Secondary Genre", value=book.get('Secondary Genre',''), height=68)
                    
                    # ROW 4
                    new_tropes = st.text_area("Tropes", value=book.get('Tropes',''))
                    
                    # Review
                    new_review = st.text_area("MY REVIEW", value=book.get('My Review',''), height=150)

                st.markdown("---")
                save_col, cancel_col = st.columns([1, 1])
                
                if save_col.button("💾 Save Changes", type="primary"):
                    # MAPPING UPDATES TO COLUMNS (1-indexed)
                    # Based on your previous script structure:
                    # Author=2, Title=3, SeriesName=5, #=6, Primary=7, Sec=8, Tropes=9, Status=10
                    # Format=11, Source=12, Owned=13, Cover=16, Rating=18, Date=19, Review=20
                    
                    r = book['real_row_index']
                    
                    # Batch update is safer/faster but we'll do cell updates for simplicity
                    ws.update_cell(r, 2, new_author)
                    ws.update_cell(r, 3, new_title)
                    ws.update_cell(r, 5, new_series)
                    ws.update_cell(r, 6, new_series_num)
                    ws.update_cell(r, 7, new_prime)
                    ws.update_cell(r, 8, new_second)
                    ws.update_cell(r, 9, new_tropes)
                    ws.update_cell(r, 10, new_status)
                    ws.update_cell(r, 11, new_fmt)
                    ws.update_cell(r, 12, new_src)
                    ws.update_cell(r, 13, new_owned)
                    # Cover URL (Col 16) - usually we don't edit this in modal, but you can add it if needed
                    ws.update_cell(r, 18, "★" * new_rating) # Save as stars
                    ws.update_cell(r, 19, new_date)
                    ws.update_cell(r, 20, new_review)
                    
                    st.success("Saved!")
                    st.session_state['show_modal'] = False
                    st.rerun()

            show_edit_modal()

    except Exception as e:
        st.error(f"Something went wrong: {e}")
        st.stop()
