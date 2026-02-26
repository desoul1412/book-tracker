import streamlit as st
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import pandas as pd
from datetime import datetime
import time

# --- CONFIG ---
st.set_page_config(page_title="Library Manager", layout="wide", page_icon="📚")

# --- CUSTOM CSS (Matches your Blue Header Look) ---
st.markdown("""
<style>
    /* Blue Header for the Modal */
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
    /* Filter Sidebar Styling */
    .filter-label {
        font-weight: bold;
        color: #5b8aed;
        margin-top: 10px;
    }
    /* Button Styling */
    .stButton button {
        border-radius: 5px;
    }
    /* Star Rating Color */
    .stSlider [data-baseweb="slider"] {
        color: #f6ad55;
    }
</style>
""", unsafe_allow_html=True)

# --- AUTH SETUP ---
creds_dict = None
bot_email = "Unavailable (Check Secrets)"

try:
    if "gcp_service_account" in st.secrets:
        creds_dict = dict(st.secrets["gcp_service_account"])
        bot_email = creds_dict["client_email"]
    else:
        # Fallback for local testing
        import toml
        with open(".streamlit/secrets.toml", "r") as f:
            data = toml.load(f)
            creds_dict = data["gcp_service_account"]
            bot_email = creds_dict["client_email"]
except Exception:
    pass

def connect_to_sheet(sheet_url):
    if not creds_dict:
        return None, "Credentials not found."
    try:
        scope = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
        creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, scope)
        client = gspread.authorize(creds)
        sheet = client.open_by_url(sheet_url)
        return sheet, None
    except Exception as e:
        return None, str(e)

# --- HELPER: COLUMN MAPPING ---
# This ensures we find the right column even if you named it slightly differently
def get_col_name(df, possible_names):
    for col in df.columns:
        if col.strip().lower() in [p.lower() for p in possible_names]:
            return col
    return None

# --- SIDEBAR ---
st.sidebar.title("📚 Library Manager")

# 1. CONNECTION WIDGET
if 'sheet_conn' not in st.session_state:
    st.sidebar.markdown("### 🔌 Connect")
    st.sidebar.info(f"**Step 1:** Share your Google Sheet with this email:")
    st.sidebar.code(bot_email, language="text")
    
    st.sidebar.markdown("**Step 2:** Paste your Sheet Link:")
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
    # 2. LOGGED IN SIDEBAR
    if st.sidebar.button("🔄 Refresh Data"):
        st.cache_data.clear()
        st.rerun()
    
    # 3. ADD NEW BOOK EXPANDER
    with st.sidebar.expander("➕ Add New Book", expanded=False):
        with st.form("add_book_form"):
            new_title = st.text_input("Title *")
            new_author = st.text_input("Author *")
            new_cover = st.text_input("Cover URL")
            new_status = st.selectbox("Status", ["To Read", "Reading", "Read", "DNF"])
            
            if st.form_submit_button("Add to Shelf"):
                try:
                    sheet = st.session_state['sheet_conn']
                    ws = sheet.worksheet("Form Responses")
                    # Generic append (adjust indices if your sheet layout is strictly fixed)
                    new_row = [""] * 21
                    new_row[0] = str(datetime.now())
                    new_row[1] = new_author  # Approx Col B
                    new_row[2] = new_title   # Approx Col C
                    new_row[9] = new_status  # Approx Col J
                    new_row[15] = new_cover  # Approx Col P
                    ws.append_row(new_row)
                    st.success("Added!")
                    st.cache_data.clear()
                    st.rerun()
                except Exception as e:
                    st.error(f"Error: {e}")

# --- MAIN APP ---
if 'sheet_conn' in st.session_state:
    try:
        sheet = st.session_state['sheet_conn']
        # Try finding the right tab, fallback to first one
        try:
            ws = sheet.worksheet("Form Responses")
        except:
            ws = sheet.get_worksheet(0)
        
        # Load Data
        data = ws.get_all_records()
        df = pd.DataFrame(data)

        # --- SMART COLUMN MAPPING ---
        # We find the actual column names in your sheet
        col_map = {
            "Title": get_col_name(df, ["Title", "Book Title"]),
            "Author": get_col_name(df, ["Author", "Author Name"]),
            "Status": get_col_name(df, ["Status", "Reading Status"]),
            "Cover": get_col_name(df, ["Cover", "Cover URL", "Image"]),
            "Rating": get_col_name(df, ["Rating", "My Rating", "Stars"]),
            "Source": get_col_name(df, ["Source", "Bought From"]),
            "Primary": get_col_name(df, ["Primary Genre", "Genre 1"]),
            "Secondary": get_col_name(df, ["Secondary Genre", "Secondary Genre(s)", "Genre 2"]),
            "Tropes": get_col_name(df, ["Tropes", "Tags"]),
            "Owned": get_col_name(df, ["Owned", "Owned?"]),
            "Review": get_col_name(df, ["Review", "My Review"]),
            "Format": get_col_name(df, ["Format"]),
            "Date": get_col_name(df, ["Date Finished", "Date Read"]),
            "Series": get_col_name(df, ["Series", "Series Name"]),
            "SeriesNum": get_col_name(df, ["Series #", "#"]),
        }

        # CLEAN DATA: Remove empty titles
        if col_map["Title"]:
            df = df[df[col_map["Title"]].astype(str).str.strip() != '']
            df['real_row_index'] = range(2, len(df) + 2)

        st.title(f"📖 {sheet.title}")

        # --- FILTERS (SIDEBAR) ---
        st.sidebar.markdown("---")
        st.sidebar.markdown("### 🔍 Filters")
        
        filtered_df = df.copy()

        def add_sidebar_filter(label, col_key):
            actual_col = col_map.get(col_key)
            if actual_col:
                # Get unique values, sort them, remove empties
                options = sorted([str(x) for x in df[actual_col].unique() if str(x).strip() != ""])
                selected = st.sidebar.multiselect(label, options)
                return selected, actual_col
            return [], None

        # 1. Source
        sel_source, col_source = add_sidebar_filter("Source", "Source")
        if sel_source: filtered_df = filtered_df[filtered_df[col_source].isin(sel_source)]

        # 2. Primary Genre
        sel_prime, col_prime = add_sidebar_filter("Primary Genre", "Primary")
        if sel_prime: filtered_df = filtered_df[filtered_df[col_prime].isin(sel_prime)]

        # 3. Secondary Genre
        sel_sec, col_sec = add_sidebar_filter("Secondary Genre(s)", "Secondary")
        if sel_sec: filtered_df = filtered_df[filtered_df[col_sec].isin(sel_sec)]

        # 4. Tropes
        sel_tropes, col_tropes = add_sidebar_filter("Tropes", "Tropes")
        if sel_tropes: filtered_df = filtered_df[filtered_df[col_tropes].isin(sel_tropes)]
        
        # 5. Rating (Star Logic)
        col_rating = col_map.get("Rating")
        if col_rating:
            # Convert stars "★★★★" to number 4 for filtering
            def parse_rating(val):
                s = str(val)
                return s.count('★') if '★' in s else (int(s) if s.isdigit() else 0)
            
            # Create a temporary numeric column for filtering
            filtered_df['temp_rating'] = filtered_df[col_rating].apply(parse_rating)
            rating_filter = st.sidebar.slider("Rating", 0, 5, (0, 5))
            filtered_df = filtered_df[
                (filtered_df['temp_rating'] >= rating_filter[0]) & 
                (filtered_df['temp_rating'] <= rating_filter[1])
            ]

        # 6. Owned
        sel_owned, col_owned = add_sidebar_filter("Owned?", "Owned")
        if sel_owned: filtered_df = filtered_df[filtered_df[col_owned].isin(sel_owned)]

        # 7. Reading Status
        sel_status, col_status = add_sidebar_filter("Reading Status", "Status")
        if sel_status: filtered_df = filtered_df[filtered_df[col_status].isin(sel_status)]

        # --- SEARCH BAR ---
        search_query = st.text_input("🔎 Search Title or Author", "")
        if search_query:
            c_title = col_map["Title"]
            c_author = col_map["Author"]
            # Search in both title and author
            filtered_df = filtered_df[
                filtered_df[c_title].astype(str).str.contains(search_query, case=False, na=False) |
                filtered_df[c_author].astype(str).str.contains(search_query, case=False, na=False)
            ]

        # --- GRID VIEW ---
        st.markdown(f"**Showing {len(filtered_df)} books**")
        cols = st.columns(5)
        
        for idx, row in filtered_df.iterrows():
            col = cols[idx % 5]
            with col:
                # Cover Image
                c_cover = col_map.get("Cover")
                img_url = str(row[c_cover]).strip() if c_cover else ""
                
                if len(img_url) < 5 or not img_url.startswith('http'):
                    img_url = "https://via.placeholder.com/150?text=No+Cover"
                
                st.image(img_url, use_container_width=True)
                
                # Title Button
                c_title = col_map["Title"]
                title_txt = str(row[c_title]) if c_title else "Untitled"
                
                if st.button(f"📘 {title_txt}", key=f"btn_{idx}"):
                    st.session_state['selected_book'] = row
                    st.session_state['show_modal'] = True
                    st.rerun()

        # --- MODAL (BOOK VIEW) ---
        if st.session_state.get('show_modal') and 'selected_book' in st.session_state:
            book = st.session_state['selected_book']
            c_title = col_map["Title"]
            title_display = book[c_title] if c_title else "Book View"

            @st.dialog(f"{title_display}")
            def show_edit_modal():
                # 1. Blue Header
                st.markdown("<div class='book-header'>BOOK VIEW</div>", unsafe_allow_html=True)
                
                # 2. Layout columns
                c1, c2 = st.columns([1, 1.5], gap="large")
                
                with c1:
                    # Title & Author
                    st.markdown(f"### {book.get(col_map['Title'], '')}")
                    st.markdown(f"*{book.get(col_map['Author'], 'Unknown')}*")
                    
                    # Series
                    col_s1, col_s2 = st.columns([1, 3])
                    s_num_val = str(book.get(col_map['SeriesNum'], ''))
                    s_name_val = str(book.get(col_map['Series'], ''))
                    
                    # We use text_input disabled=False to allow editing
                    s_num = col_s1.text_input("#", value=s_num_val)
                    s_name = col_s2.text_input("Series", value=s_name_val)
                    
                    st.markdown("---")
                    
                    # Cover
                    img_url = str(book.get(col_map['Cover'], '')).strip()
                    if len(img_url) > 5:
                        st.image(img_url, use_container_width=True)
                    
                    # RATING (Star Logic)
                    st.caption("Rating")
                    raw_rating = book.get(col_map['Rating'], 0)
                    # Helper to convert "★★★★" -> 4
                    if isinstance(raw_rating, str):
                        start_rating = raw_rating.count('★') if '★' in raw_rating else (int(raw_rating) if raw_rating.isdigit() else 0)
                    else:
                        start_rating = int(raw_rating) if raw_rating else 0
                        
                    new_rating = st.slider("Stars", 0, 5, start_rating, label_visibility="collapsed")
                    st.markdown(f"**{new_rating} Stars** {'★' * new_rating}")
                    
                    # STATUS
                    st.caption("Status")
                    status_opts = ["To Read", "Reading", "Read", "DNF"]
                    curr_stat = book.get(col_map['Status'], 'To Read')
                    safe_idx = status_opts.index(curr_stat) if curr_stat in status_opts else 0
                    new_status = st.selectbox("Status", status_opts, index=safe_idx, label_visibility="collapsed")

                with c2:
                    # Row 1
                    r1a, r1b = st.columns(2)
                    new_date = r1a.text_input("DATE FINISHED", value=str(book.get(col_map['Date'], '')))
                    new_owned = r1b.text_input("OWNED?", value=str(book.get(col_map['Owned'], '')))
                    
                    # Row 2
                    r2a, r2b = st.columns(2)
                    new_fmt = r2a.text_input("FORMAT", value=str(book.get(col_map['Format'], '')))
                    new_src = r2b.text_input("SOURCE", value=str(book.get(col_map['Source'], '')))
                    
                    # Row 3
                    new_prime = st.text_area("PRIMARY GENRE", value=str(book.get(col_map['Primary'], '')), height=68)
                    
                    # Row 4
                    new_sec = st.text_area("SECONDARY GENRE", value=str(book.get(col_map['Secondary'], '')), height=100)
                    
                    # Row 5
                    new_tropes = st.text_area("TROPES", value=str(book.get(col_map['Tropes'], '')), height=80)
                    
                    # Row 6
                    new_review = st.text_area("MY REVIEW", value=str(book.get(col_map['Review'], '')), height=150)

                st.markdown("---")
                col_close, col_save = st.columns([1, 1])
                
                if col_save.button("💾 Save Changes", type="primary"):
                    try:
                        r = book['real_row_index']
                        
                        # UPDATE CELLS using Column Letters or Indexes
                        # To be safe, we need the exact column index from the original dataframe columns
                        # This helper finds the index (1-based) for gspread
                        def get_col_idx(col_name):
                            return df.columns.get_loc(col_name) + 1
                        
                        # Convert stars back to string "★★★★" if you prefer, or int
                        rating_to_save = "★" * new_rating if new_rating > 0 else ""
                        
                        # Execute Updates
                        if col_map['Series']: ws.update_cell(r, get_col_idx(col_map['Series']), s_name)
                        if col_map['SeriesNum']: ws.update_cell(r, get_col_idx(col_map['SeriesNum']), s_num)
                        if col_map['Date']: ws.update_cell(r, get_col_idx(col_map['Date']), new_date)
                        if col_map['Owned']: ws.update_cell(r, get_col_idx(col_map['Owned']), new_owned)
                        if col_map['Format']: ws.update_cell(r, get_col_idx(col_map['Format']), new_fmt)
                        if col_map['Source']: ws.update_cell(r, get_col_idx(col_map['Source']), new_src)
                        if col_map['Primary']: ws.update_cell(r, get_col_idx(col_map['Primary']), new_prime)
                        if col_map['Secondary']: ws.update_cell(r, get_col_idx(col_map['Secondary']), new_sec)
                        if col_map['Tropes']: ws.update_cell(r, get_col_idx(col_map['Tropes']), new_tropes)
                        if col_map['Review']: ws.update_cell(r, get_col_idx(col_map['Review']), new_review)
                        if col_map['Status']: ws.update_cell(r, get_col_idx(col_map['Status']), new_status)
                        if col_map['Rating']: ws.update_cell(r, get_col_idx(col_map['Rating']), rating_to_save)
                        
                        st.success("Saved!")
                        st.session_state['show_modal'] = False
                        st.cache_data.clear()
                        st.rerun()
                    except Exception as e:
                        st.error(f"Save failed: {e}")

            show_edit_modal()

    except Exception as e:
        st.error(f"Something went wrong: {e}")
        if 'df' in locals():
            with st.expander("Debug: Columns Found in Sheet"):
                st.write(df.columns.tolist())
