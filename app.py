import streamlit as st
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import pandas as pd
from datetime import datetime

# --- CONFIG ---
st.set_page_config(page_title="Library Manager", layout="wide", page_icon="📚")

# --- CUSTOM CSS ---
st.markdown("""
<style>
    /* 1. UNIFORM COVERS & ALIGNMENT */
    div[data-testid="stImage"] img {
        height: 300px !important;
        object-fit: cover !important;
        border-radius: 8px;
        width: 100% !important;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    /* 2. TITLE BUTTON STYLING */
    /* This makes the button look like a bold title label under the image */
    div[data-testid="stButton"] button {
        width: 100%;
        border: none !important;
        background: transparent !important;
        color: #2d3748 !important;
        font-weight: 800 !important;
        font-size: 15px !important;
        text-align: center !important;
        padding: 5px 0 !important;
        margin-top: 5px !important;
        white-space: nowrap !important; 
        overflow: hidden !important;
        text-overflow: ellipsis !important;
    }
    div[data-testid="stButton"] button:hover {
        color: #5b8aed !important;
    }
    div[data-testid="stButton"] button:focus {
        box-shadow: none !important;
        color: #5b8aed !important;
    }

    /* 3. MODAL HEADER */
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
        text-transform: uppercase;
    }

    /* 4. CLEANUP */
    .css-15zrgzn {display: none}
    div[data-testid="stFeedback"] { justify-content: center; }
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
st.sidebar.title("📚 Library")

if 'sheet_conn' not in st.session_state:
    st.sidebar.markdown("### 🔌 Connect")
    st.sidebar.info(f"**Step 1:** Share Sheet with:")
    st.sidebar.code(bot_email, language="text")
    sheet_url = st.sidebar.text_input("**Step 2:** Sheet URL", placeholder="https://docs.google.com/...")
    
    if st.sidebar.button("Connect"):
        if sheet_url:
            sheet, error = connect_to_sheet(sheet_url)
            if sheet:
                st.session_state['sheet_conn'] = sheet
                st.session_state['sheet_url'] = sheet_url
                st.rerun()
            else:
                st.sidebar.error(f"Failed: {error}")
else:
    if st.sidebar.button("🔄 Refresh"):
        st.cache_data.clear()
        st.rerun()
    
    with st.sidebar.expander("➕ Add Book", expanded=False):
        with st.form("add_book_form"):
            new_title = st.text_input("Title *")
            new_author = st.text_input("Author *")
            new_cover = st.text_input("Cover URL")
            new_status = st.selectbox("Status", ["To Read", "Reading", "Read", "DNF"])
            
            if st.form_submit_button("Add"):
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

        # --- FILTERS (Logic Updated for Split Values) ---
        st.sidebar.markdown("---")
        st.sidebar.markdown("### 🔍 Filters")
        
        filtered_df = df.copy()

        # Helper to get unique SINGLE items from comma-separated lists
        def get_unique_items(df, col_name):
            if not col_name: return []
            # Split by comma, strip whitespace, explode into one list, get unique
            items = df[col_name].astype(str).str.split(',').explode().str.strip()
            return sorted([x for x in items.unique() if x and x.lower() != 'nan'])

        # 1. Simple Filters (Source, Status, Owned) - No splitting needed usually
        def add_simple_filter(label, col_key):
            actual_col = col_map.get(col_key)
            if actual_col:
                opts = sorted([str(x) for x in df[actual_col].unique() if str(x).strip() != ""])
                sel = st.sidebar.multiselect(label, opts)
                return sel, actual_col
            return [], None

        # 2. Complex Filters (Genres, Tropes) - Split comma values
        def add_split_filter(label, col_key):
            actual_col = col_map.get(col_key)
            if actual_col:
                # Get unique SINGLE tags
                unique_tags = get_unique_items(df, actual_col)
                selected_tags = st.sidebar.multiselect(label, unique_tags)
                return selected_tags, actual_col
            return [], None

        # --- APPLY FILTERS ---
        sel_stat, col_stat = add_simple_filter("Status", "Status")
        if sel_stat: filtered_df = filtered_df[filtered_df[col_stat].isin(sel_stat)]

        sel_src, col_src = add_simple_filter("Source", "Source")
        if sel_src: filtered_df = filtered_df[filtered_df[col_src].isin(sel_src)]

        sel_prime, col_prime = add_split_filter("Primary Genre", "Primary")
        if sel_prime: 
            # Check if ANY of the selected tags exist in the row's string
            # We create a regex pattern like "Romance|Fantasy" and search
            pattern = '|'.join(sel_prime)
            filtered_df = filtered_df[filtered_df[col_prime].astype(str).str.contains(pattern, case=False, na=False)]

        sel_sec, col_sec = add_split_filter("Secondary Genre(s)", "Secondary")
        if sel_sec: 
            pattern = '|'.join(sel_sec)
            filtered_df = filtered_df[filtered_df[col_sec].astype(str).str.contains(pattern, case=False, na=False)]

        sel_tropes, col_tropes = add_split_filter("Tropes", "Tropes")
        if sel_tropes: 
            pattern = '|'.join(sel_tropes)
            filtered_df = filtered_df[filtered_df[col_tropes].astype(str).str.contains(pattern, case=False, na=False)]
        
        # --- SEARCH ---
        search_query = st.text_input("🔎 Search Title or Author", "")
        if search_query:
            c_title = col_map["Title"]
            c_author = col_map["Author"]
            filtered_df = filtered_df[
                filtered_df[c_title].astype(str).str.contains(search_query, case=False, na=False) |
                filtered_df[c_author].astype(str).str.contains(search_query, case=False, na=False)
            ]

        # --- GRID VIEW (Fixed) ---
        st.markdown(f"**Showing {len(filtered_df)} books**")
        
        cols = st.columns(5)
        
        for idx, row in filtered_df.iterrows():
            col = cols[idx % 5]
            with col:
                # 1. IMAGE (Fixed Height)
                c_cover = col_map.get("Cover")
                img_url = str(row[c_cover]).strip() if c_cover else ""
                if len(img_url) < 5 or not img_url.startswith('http'):
                    img_url = "https://via.placeholder.com/300x450?text=No+Cover"
                
                # We simply display the image. The user will click the Title Button below.
                st.image(img_url, use_container_width=True)
                
                # 2. TITLE (ACTS AS THE BUTTON)
                c_title = col_map["Title"]
                title_txt = str(row[c_title]) if c_title else "Untitled"
                
                # Clicking this button opens the modal
                if st.button(title_txt, key=f"btn_{idx}"):
                    st.session_state['selected_book'] = row
                    st.session_state['show_modal'] = True
                    st.rerun()

        # --- MODAL ---
        if st.session_state.get('show_modal') and 'selected_book' in st.session_state:
            book = st.session_state['selected_book']
            
            @st.dialog("Book View")
            def show_edit_modal():
                st.markdown(f"<div class='book-header'>BOOK VIEW</div>", unsafe_allow_html=True)
                
                c1, c2 = st.columns([1, 1.5], gap="large")
                
                with c1:
                    st.markdown(f"### {book.get(col_map['Title'], '')}")
                    st.markdown(f"*{book.get(col_map['Author'], 'Unknown')}*")
                    
                    col_s1, col_s2 = st.columns([1, 3])
                    s_num = col_s1.text_input("#", value=str(book.get(col_map['SeriesNum'], '')))
                    s_name = col_s2.text_input("Series", value=str(book.get(col_map['Series'], '')))
                    
                    st.markdown("---")
                    
                    img_url = str(book.get(col_map['Cover'], '')).strip()
                    if len(img_url) > 5:
                        st.image(img_url, use_container_width=True)
                    
                    # RATING
                    st.caption("Rating")
                    raw_rating = book.get(col_map['Rating'], 0)
                    if isinstance(raw_rating, str):
                        curr_stars = raw_rating.count('★') if '★' in raw_rating else (int(raw_rating) if raw_rating.isdigit() else 0)
                    else:
                        curr_stars = int(raw_rating) if raw_rating else 0
                    
                    # Feedback returns 0-4 index. If 0 stars, use None? No, keep simple.
                    default_idx = curr_stars - 1 if curr_stars > 0 else None
                    new_star_idx = st.feedback("stars", key="modal_stars")
                    final_stars = new_star_idx + 1 if new_star_idx is not None else curr_stars

                    # STATUS
                    st.caption("Status")
                    opts = ["To Read", "Reading", "Read", "DNF"]
                    curr = book.get(col_map['Status'], 'To Read')
                    idx_stat = opts.index(curr) if curr in opts else 0
                    new_stat = st.selectbox("Status", opts, index=idx_stat, label_visibility="collapsed")

                with c2:
                    r1a, r1b = st.columns(2)
                    new_date = r1a.text_input("DATE FINISHED", value=str(book.get(col_map['Date'], '')))
                    new_owned = r1b.text_input("OWNED?", value=str(book.get(col_map['Owned'], '')))
                    
                    r2a, r2b = st.columns(2)
                    new_fmt = r2a.text_input("FORMAT", value=str(book.get(col_map['Format'], '')))
                    new_src = r2b.text_input("SOURCE", value=str(book.get(col_map['Source'], '')))
                    
                    new_p = st.text_area("PRIMARY GENRE", value=str(book.get(col_map['Primary'], '')), height=70)
                    new_s = st.text_area("SECONDARY GENRE", value=str(book.get(col_map['Secondary'], '')), height=100)
                    new_t = st.text_area("TROPES", value=str(book.get(col_map['Tropes'], '')), height=80)
                    new_r = st.text_area("MY REVIEW", value=str(book.get(col_map['Review'], '')), height=150)

                st.markdown("---")
                _, col_save = st.columns([1, 1])
                
                if col_save.button("💾 Save Changes", type="primary"):
                    try:
                        r = book['real_row_index']
                        def get_idx(name): return df.columns.get_loc(name) + 1
                        
                        rating_str = "★" * final_stars if final_stars > 0 else ""
                        
                        if col_map['Series']: ws.update_cell(r, get_idx(col_map['Series']), s_name)
                        if col_map['SeriesNum']: ws.update_cell(r, get_idx(col_map['SeriesNum']), s_num)
                        if col_map['Date']: ws.update_cell(r, get_idx(col_map['Date']), new_date)
                        if col_map['Owned']: ws.update_cell(r, get_idx(col_map['Owned']), new_owned)
                        if col_map['Format']: ws.update_cell(r, get_idx(col_map['Format']), new_fmt)
                        if col_map['Source']: ws.update_cell(r, get_idx(col_map['Source']), new_src)
                        if col_map['Primary']: ws.update_cell(r, get_idx(col_map['Primary']), new_p)
                        if col_map['Secondary']: ws.update_cell(r, get_idx(col_map['Secondary']), new_s)
                        if col_map['Tropes']: ws.update_cell(r, get_idx(col_map['Tropes']), new_t)
                        if col_map['Review']: ws.update_cell(r, get_idx(col_map['Review']), new_r)
                        if col_map['Status']: ws.update_cell(r, get_idx(col_map['Status']), new_stat)
                        if col_map['Rating']: ws.update_cell(r, get_idx(col_map['Rating']), rating_str)
                        
                        st.success("Saved!")
                        st.session_state['show_modal'] = False
                        st.cache_data.clear()
                        st.rerun()
                    except Exception as e:
                        st.error(f"Save failed: {e}")

            show_edit_modal()

    except Exception as e:
        st.error(f"Something went wrong: {e}")
