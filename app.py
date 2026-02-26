import streamlit as st
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import pandas as pd
from datetime import datetime

# --- CONFIG ---
st.set_page_config(page_title="Library Manager", layout="wide", page_icon="📚")

# --- CUSTOM CSS (Styling) ---
st.markdown("""
<style>
    /* 1. FORCE UNIFORM BOOK COVERS IN GRID */
    /* This targets images inside the main grid to specific dimensions */
    div[data-testid="stImage"] img {
        height: 250px !important;  /* Fixed Height */
        object-fit: cover !important; /* Crop nicely, don't stretch */
        border-radius: 8px; /* Rounded corners */
        width: 100% !important;
    }

    /* 2. CENTERED & BOLD TITLES */
    .book-title-card {
        text-align: center;
        font-weight: 800;
        font-size: 14px;
        margin-top: 5px;
        margin-bottom: 10px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis; /* Add "..." if too long */
        color: #2d3748;
    }

    /* 3. BLUE HEADER FOR MODAL */
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
    
    /* 4. SIDEBAR FILTERS */
    .filter-label {
        font-weight: bold;
        color: #5b8aed;
        margin-top: 10px;
    }
    
    /* Hide anchor links */
    .css-15zrgzn {display: none}
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

def get_col_name(df, possible_names):
    for col in df.columns:
        if col.strip().lower() in [p.lower() for p in possible_names]:
            return col
    return None

# --- SIDEBAR ---
st.sidebar.title("📚 Library Manager")

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
    if st.sidebar.button("🔄 Refresh Data"):
        st.cache_data.clear()
        st.rerun()
    
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
                    new_row = [""] * 21
                    new_row[0] = str(datetime.now())
                    new_row[1] = new_author
                    new_row[2] = new_title
                    new_row[9] = new_status
                    new_row[15] = new_cover
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
        try:
            ws = sheet.worksheet("Form Responses")
        except:
            ws = sheet.get_worksheet(0)
        
        data = ws.get_all_records()
        df = pd.DataFrame(data)

        # MAPPING
        col_map = {
            "Title": get_col_name(df, ["Title", "Book Title"]),
            "Author": get_col_name(df, ["Author", "Author Name"]),
            "Status": get_col_name(df, ["Status", "Reading Status"]),
            "Cover": get_col_name(df, ["Cover", "Cover URL", "Image"]),
            "Rating": get_col_name(df, ["Rating", "My Rating", "Stars"]),
            "Source": get_col_name(df, ["Source", "Bought From"]),
            "Primary": get_col_name(df, ["Primary Genre", "Genre 1"]),
            "Secondary": get_col_name(df, ["Secondary Genre", "Secondary Genre(s)"]),
            "Tropes": get_col_name(df, ["Tropes", "Tags"]),
            "Owned": get_col_name(df, ["Owned", "Owned?"]),
            "Review": get_col_name(df, ["Review", "My Review"]),
            "Format": get_col_name(df, ["Format"]),
            "Date": get_col_name(df, ["Date Finished", "Date Read"]),
            "Series": get_col_name(df, ["Series", "Series Name"]),
            "SeriesNum": get_col_name(df, ["Series #", "#"]),
        }

        if col_map["Title"]:
            df = df[df[col_map["Title"]].astype(str).str.strip() != '']
            df['real_row_index'] = range(2, len(df) + 2)

        st.title(f"📖 {sheet.title}")

        # --- FILTERS ---
        st.sidebar.markdown("---")
        st.sidebar.markdown("### 🔍 Filters")
        
        filtered_df = df.copy()

        def add_sidebar_filter(label, col_key):
            actual_col = col_map.get(col_key)
            if actual_col:
                options = sorted([str(x) for x in df[actual_col].unique() if str(x).strip() != ""])
                selected = st.sidebar.multiselect(label, options)
                return selected, actual_col
            return [], None

        sel_source, col_source = add_sidebar_filter("Source", "Source")
        if sel_source: filtered_df = filtered_df[filtered_df[col_source].isin(sel_source)]

        sel_prime, col_prime = add_sidebar_filter("Primary Genre", "Primary")
        if sel_prime: filtered_df = filtered_df[filtered_df[col_prime].isin(sel_prime)]

        sel_sec, col_sec = add_sidebar_filter("Secondary Genre(s)", "Secondary")
        if sel_sec: filtered_df = filtered_df[filtered_df[col_sec].isin(sel_sec)]

        sel_tropes, col_tropes = add_sidebar_filter("Tropes", "Tropes")
        if sel_tropes: filtered_df = filtered_df[filtered_df[col_tropes].isin(sel_tropes)]
        
        # STAR RATING FILTER (Updated to Clickable Stars)
        col_rating = col_map.get("Rating")
        if col_rating:
            # Parse stars to numbers
            def parse_rating(val):
                s = str(val)
                return s.count('★') if '★' in s else (int(s) if s.isdigit() else 0)
            
            filtered_df['temp_rating'] = filtered_df[col_rating].apply(parse_rating)
            
            st.sidebar.caption("Min Rating")
            # Using st.feedback as an input for filtering
            min_stars = st.sidebar.feedback("stars", key="filter_stars")
            
            # If user picks 3 stars, show books with >= 3 stars. (None means no filter)
            if min_stars is not None:
                # st.feedback returns 0-4 index usually, let's map it correctly.
                # Actually st.feedback returns integer of stars clicked (e.g. 1 star = 0 index? No, usually 1-5 logic in feedback). 
                # Let's adjust: In st.feedback, 1st star = 0, 5th star = 4. So we add 1.
                threshold = min_stars + 1
                filtered_df = filtered_df[filtered_df['temp_rating'] >= threshold]

        sel_owned, col_owned = add_sidebar_filter("Owned?", "Owned")
        if sel_owned: filtered_df = filtered_df[filtered_df[col_owned].isin(sel_owned)]

        sel_status, col_status = add_sidebar_filter("Reading Status", "Status")
        if sel_status: filtered_df = filtered_df[filtered_df[col_status].isin(sel_status)]

        # --- SEARCH ---
        search_query = st.text_input("🔎 Search Title or Author", "")
        if search_query:
            c_title = col_map["Title"]
            c_author = col_map["Author"]
            filtered_df = filtered_df[
                filtered_df[c_title].astype(str).str.contains(search_query, case=False, na=False) |
                filtered_df[c_author].astype(str).str.contains(search_query, case=False, na=False)
            ]

        # --- GRID VIEW (Fixed Covers & Titles) ---
        st.markdown(f"**Showing {len(filtered_df)} books**")
        cols = st.columns(5)
        
        for idx, row in filtered_df.iterrows():
            col = cols[idx % 5]
            with col:
                # 1. COVER IMAGE
                c_cover = col_map.get("Cover")
                img_url = str(row[c_cover]).strip() if c_cover else ""
                if len(img_url) < 5 or not img_url.startswith('http'):
                    img_url = "https://via.placeholder.com/150?text=No+Cover"
                
                st.image(img_url, use_container_width=True)
                
                # 2. CENTERED TITLE
                c_title = col_map["Title"]
                title_txt = str(row[c_title]) if c_title else "Untitled"
                st.markdown(f"<div class='book-title-card'>{title_txt}</div>", unsafe_allow_html=True)
                
                # 3. BUTTON (Full Width)
                if st.button("Edit", key=f"btn_{idx}"):
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
                st.markdown("<div class='book-header'>BOOK VIEW</div>", unsafe_allow_html=True)
                
                c1, c2 = st.columns([1, 1.5], gap="large")
                
                with c1:
                    st.markdown(f"### {book.get(col_map['Title'], '')}")
                    st.markdown(f"*{book.get(col_map['Author'], 'Unknown')}*")
                    
                    col_s1, col_s2 = st.columns([1, 3])
                    s_num_val = str(book.get(col_map['SeriesNum'], ''))
                    s_name_val = str(book.get(col_map['Series'], ''))
                    s_num = col_s1.text_input("#", value=s_num_val)
                    s_name = col_s2.text_input("Series", value=s_name_val)
                    
                    st.markdown("---")
                    
                    img_url = str(book.get(col_map['Cover'], '')).strip()
                    if len(img_url) > 5:
                        st.image(img_url, use_container_width=True)
                    
                    # --- CLICKABLE STARS (EDITABLE) ---
                    st.caption("Rating")
                    raw_rating = book.get(col_map['Rating'], 0)
                    if isinstance(raw_rating, str):
                        start_rating = raw_rating.count('★') if '★' in raw_rating else (int(raw_rating) if raw_rating.isdigit() else 0)
                    else:
                        start_rating = int(raw_rating) if raw_rating else 0
                    
                    # Convert to 0-4 index for st.feedback
                    default_star_idx = start_rating - 1 if start_rating > 0 else 0
                    if start_rating == 0: default_star_idx = None # No stars selected
                    
                    new_star_idx = st.feedback("stars", key="modal_stars")
                    
                    # If user hasn't clicked yet, we don't have a value. 
                    # Streamlit logic for pre-filling st.feedback isn't "default_value", 
                    # it relies on session state. But to keep it simple, we just read the input.
                    # Logic: If new_star_idx is None, keep old rating. If clicked, use new.
                    final_rating = start_rating
                    if new_star_idx is not None:
                        final_rating = new_star_idx + 1

                    # STATUS
                    st.caption("Status")
                    status_opts = ["To Read", "Reading", "Read", "DNF"]
                    curr_stat = book.get(col_map['Status'], 'To Read')
                    safe_idx = status_opts.index(curr_stat) if curr_stat in status_opts else 0
                    new_status = st.selectbox("Status", status_opts, index=safe_idx, label_visibility="collapsed")

                with c2:
                    r1a, r1b = st.columns(2)
                    new_date = r1a.text_input("DATE FINISHED", value=str(book.get(col_map['Date'], '')))
                    new_owned = r1b.text_input("OWNED?", value=str(book.get(col_map['Owned'], '')))
                    
                    r2a, r2b = st.columns(2)
                    new_fmt = r2a.text_input("FORMAT", value=str(book.get(col_map['Format'], '')))
                    new_src = r2b.text_input("SOURCE", value=str(book.get(col_map['Source'], '')))
                    
                    new_prime = st.text_area("PRIMARY GENRE", value=str(book.get(col_map['Primary'], '')), height=68)
                    new_sec = st.text_area("SECONDARY GENRE", value=str(book.get(col_map['Secondary'], '')), height=100)
                    new_tropes = st.text_area("TROPES", value=str(book.get(col_map['Tropes'], '')), height=80)
                    new_review = st.text_area("MY REVIEW", value=str(book.get(col_map['Review'], '')), height=150)

                st.markdown("---")
                col_close, col_save = st.columns([1, 1])
                
                if col_save.button("💾 Save Changes", type="primary"):
                    try:
                        r = book['real_row_index']
                        
                        def get_col_idx(col_name):
                            return df.columns.get_loc(col_name) + 1
                        
                        rating_to_save = "★" * final_rating if final_rating > 0 else ""
                        
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
