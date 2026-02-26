import streamlit as st
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import pandas as pd
from datetime import datetime

# --- CONFIG ---
st.set_page_config(page_title="Library Manager", layout="wide", page_icon="📚")

# --- CUSTOM CSS (Matches your Blue Header Screenshot) ---
st.markdown("""
<style>
    .book-header {
        background-color: #5b8aed;
        color: white;
        padding: 15px;
        text-align: center;
        font-family: 'Arial', sans-serif;
        font-weight: bold;
        font-size: 24px;
        border-radius: 8px 8px 0 0;
        margin-bottom: 20px;
        letter-spacing: 2px;
        text-transform: uppercase;
    }
    .stButton button {
        width: 100%;
        border-radius: 5px;
    }
    /* Hide the default Streamlit anchor links to make it look cleaner */
    .css-15zrgzn {display: none}
</style>
""", unsafe_allow_html=True)

# --- AUTH SETUP ---
# Try to get credentials from Secrets (Cloud) or Local
creds_dict = None
bot_email = "Unavailable"

try:
    if "gcp_service_account" in st.secrets:
        creds_dict = dict(st.secrets["gcp_service_account"])
        bot_email = creds_dict["client_email"]
    else:
        # Fallback for local testing
        import json
        import toml
        with open(".streamlit/secrets.toml", "r") as f:
            data = toml.load(f)
            creds_dict = data["gcp_service_account"]
            bot_email = creds_dict["client_email"]
except Exception:
    pass

def connect_to_sheet(sheet_url):
    if not creds_dict:
        return None, "Credentials not found. Check .streamlit/secrets.toml"
    try:
        scope = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
        creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, scope)
        client = gspread.authorize(creds)
        sheet = client.open_by_url(sheet_url)
        return sheet, None
    except Exception as e:
        return None, str(e)

# --- SIDEBAR ---
st.sidebar.title("📚 Library Manager")

# 1. CONNECTION WIDGET (With the Bot Email!)
if 'sheet_conn' not in st.session_state:
    st.sidebar.markdown("### 🔌 Connect")
    
    st.sidebar.info("Step 1: Share your Google Sheet with this email:")
    st.sidebar.code(bot_email, language="text")
    
    st.sidebar.markdown("Step 2: Paste your Sheet Link:")
    sheet_url = st.sidebar.text_input("Google Sheet URL", placeholder="https://docs.google.com/...")
    
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
    
    # 2. ADD BOOK (Only shows when connected)
    st.sidebar.markdown("---")
    with st.sidebar.expander("➕ Add New Book", expanded=False):
        with st.form("add_book_form"):
            new_title = st.text_input("Title *")
            new_author = st.text_input("Author *")
            new_cover = st.text_input("Cover URL")
            new_status = st.selectbox("Status", ["To Read", "Reading", "Read", "DNF"])
            
            if st.form_submit_button("Add to Shelf"):
                if new_title and new_author:
                    try:
                        sheet = st.session_state['sheet_conn']
                        ws = sheet.worksheet("Form Responses")
                        # Append logic (Adjust columns as needed for your specific sheet)
                        new_row = [""] * 21
                        new_row[0] = str(datetime.now())
                        new_row[1] = new_author
                        new_row[2] = new_title
                        new_row[9] = new_status # Column J
                        new_row[15] = new_cover # Column P
                        ws.append_row(new_row)
                        st.success("Book Added!")
                        st.cache_data.clear()
                        st.rerun()
                    except Exception as e:
                        st.error(f"Error: {e}")

# --- MAIN APP ---
if 'sheet_conn' in st.session_state:
    try:
        sheet = st.session_state['sheet_conn']
        ws = sheet.worksheet("Form Responses")
        
        # Load Data
        data = ws.get_all_records()
        df = pd.DataFrame(data)

        # --- DATA CLEANING (Fixes 'KeyError: Status') ---
        # 1. Strip spaces from column names (e.g. "Status " -> "Status")
        df.columns = df.columns.str.strip()
        
        # 2. Normalize 'Status' column name if it's different
        # If your sheet calls it "Reading Status", we rename it to "Status" for this code
        if "Status" not in df.columns and "Reading Status" in df.columns:
            df.rename(columns={"Reading Status": "Status"}, inplace=True)
            
        # 3. Handle Empty Rows
        if "Title" in df.columns:
            df = df[df['Title'].astype(str).str.strip() != '']
            df['real_row_index'] = range(2, len(df) + 2) # Track Excel Row ID

        st.title(f"📖 {sheet.title}")

        # --- SEARCH & FILTER ---
        col_search, col_filter = st.columns([2, 1])
        with col_search:
            search_choice = st.selectbox("🔍 Search Book:", [""] + df['Title'].tolist() if "Title" in df.columns else [], index=0)
        
        with col_filter:
            if "Status" in df.columns:
                filter_status = st.multiselect("Filter Status:", df['Status'].unique())
            else:
                st.warning("Column 'Status' not found.")
                filter_status = []

        # Apply Filters
        filtered_df = df.copy()
        if search_choice:
            filtered_df = filtered_df[filtered_df['Title'] == search_choice]
        if filter_status:
            filtered_df = filtered_df[filtered_df['Status'].isin(filter_status)]

        # --- GRID VIEW ---
        cols = st.columns(5)
        for idx, row in filtered_df.iterrows():
            col = cols[idx % 5]
            with col:
                # Safe Image Loading
                img_url = str(row.get('Cover URL', '')).strip()
                if len(img_url) < 5 or not img_url.startswith('http'):
                    img_url = "https://via.placeholder.com/150?text=No+Cover"
                
                st.image(img_url, use_container_width=True)
                
                # Button Click -> Open Modal
                if st.button(f"📘 {row.get('Title', 'Untitled')}", key=f"btn_{idx}"):
                    st.session_state['selected_book'] = row
                    st.session_state['show_modal'] = True
                    st.rerun()

        # --- THE 'BLUE HEADER' MODAL ---
        if st.session_state.get('show_modal') and 'selected_book' in st.session_state:
            book = st.session_state['selected_book']
            
            @st.dialog(f"{book.get('Title', 'Book View')}")
            def show_edit_modal():
                # 1. The Blue Header
                st.markdown("<div class='book-header'>BOOK VIEW</div>", unsafe_allow_html=True)
                
                # 2. Main Layout (Left: Image/Core | Right: Details)
                c1, c2 = st.columns([1, 1.5], gap="large")
                
                with c1:
                    # Title & Author Group
                    st.markdown(f"### {book.get('Title', 'Untitled')}")
                    st.markdown(f"*{book.get('Author', 'Unknown')}*")
                    
                    # Series Line: # 3.5 in Hidden Legacy
                    col_s1, col_s2 = st.columns([1, 3])
                    s_num = col_s1.text_input("#", value=str(book.get('Series #', '')))
                    s_name = col_s2.text_input("Series", value=book.get('Series Name', ''))
                    
                    st.markdown("---")
                    
                    # Cover Image
                    img_url = str(book.get('Cover URL', '')).strip()
                    if len(img_url) > 5:
                        st.image(img_url, use_container_width=True)
                    
                    # Rating (Stars)
                    st.caption("Rating")
                    curr_rating = book.get('Rating', 0)
                    if isinstance(curr_rating, str): # Handle "★★★★" or "4"
                        curr_rating = len(curr_rating) if '★' in curr_rating else (int(curr_rating) if curr_rating.isdigit() else 0)
                    new_rating = st.slider("Rating", 0, 5, int(curr_rating), label_visibility="collapsed")
                    
                    # Status
                    st.caption("Status")
                    status_opts = ["To Read", "Reading", "Read", "DNF"]
                    curr_stat = book.get('Status', 'To Read')
                    # Fix: Handle case where sheet has status not in list
                    safe_index = status_opts.index(curr_stat) if curr_stat in status_opts else 0
                    new_status = st.selectbox("Status", status_opts, index=safe_index, label_visibility="collapsed")

                with c2:
                    # Create the "Card" look for inputs
                    # Row 1
                    r1a, r1b = st.columns(2)
                    new_date = r1a.text_input("DATE FINISHED", value=str(book.get('Date Finished', '')))
                    new_owned = r1b.text_input("OWNED?", value=str(book.get('Owned', '')))
                    
                    # Row 2
                    r2a, r2b = st.columns(2)
                    new_fmt = r2a.text_input("FORMAT", value=str(book.get('Format', '')))
                    new_src = r2b.text_input("SOURCE", value=str(book.get('Source', '')))
                    
                    # Genres
                    new_prime = st.text_area("PRIMARY GENRE", value=str(book.get('Primary Genre', '')), height=68)
                    new_second = st.text_area("SECONDARY GENRE", value=str(book.get('Secondary Genre', '')), height=100)
                    
                    # Tropes
                    new_tropes = st.text_area("TROPES", value=str(book.get('Tropes', '')), height=80)
                    
                    # Review
                    new_review = st.text_area("MY REVIEW", value=str(book.get('My Review', '')), height=150)

                # Footer Buttons
                st.markdown("---")
                col_close, col_save = st.columns([1, 1])
                
                if col_save.button("💾 Save Changes", type="primary"):
                    try:
                        r = book['real_row_index']
                        
                        # UPDATE CELLS (Adjust Column Numbers if your sheet is different!)
                        # Author(2), Title(3), Series(5), #(6), Prim(7), Sec(8), Trope(9), Stat(10)
                        # Fmt(11), Src(12), Own(13), Cover(16), Rate(18), Date(19), Rev(20)
                        ws.update_cell(r, 5, s_name)
                        ws.update_cell(r, 6, s_num)
                        ws.update_cell(r, 7, new_prime)
                        ws.update_cell(r, 8, new_second)
                        ws.update_cell(r, 9, new_tropes)
                        ws.update_cell(r, 10, new_status)
                        ws.update_cell(r, 11, new_fmt)
                        ws.update_cell(r, 12, new_src)
                        ws.update_cell(r, 13, new_owned)
                        ws.update_cell(r, 18, "★" * new_rating)
                        ws.update_cell(r, 19, new_date)
                        ws.update_cell(r, 20, new_review)
                        
                        st.success("Saved!")
                        st.session_state['show_modal'] = False
                        st.cache_data.clear()
                        st.rerun()
                    except Exception as e:
                        st.error(f"Save failed: {e}")

            show_edit_modal()

    except Exception as e:
        # Improved Error Message to help debug
        st.error(f"Something went wrong: {e}")
        st.info("Tip: Check your Google Sheet Header row. Does it exactly match 'Title', 'Status', 'Cover URL'?")
        if 'df' in locals():
            with st.expander("Debug: View Columns Found"):
                st.write(df.columns.tolist())
