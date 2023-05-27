// Render dom element for a search result
function displayResult(object) {
  const element = document.createElement('li');
  element.style.padding = '5px 0';

  const link = document.createElement('a');
  link.href = object.url;
  link.textContent = object.title;
  link.style.display = 'block';

  element.appendChild(link);
  element.insertAdjacentHTML('beforeend',
      object.points + ' points '
      + 'by '
      + `<a href=${'user?id=' + object.author}>${object.author}</a>`
      + ' | '
      + timestampToRelativeTime(object.created_at)
      + ' | '
      + `<a href=${'item?id=' + object.objectID}>${object.num_comments} comments</a>`
  )

  return element;
}

// Update sidebar content
function updateSidebarResults() {
  sidebarResults.innerHTML = '';
  searchHackerNews(query, numOfResultsDropdown.value)
      .then(result => {
        const list = document.createElement('ul');
        list.style.padding = 'unset';
        list.style.listStyle = 'none';
        result.hits.forEach(hit => {
          const element = displayResult(hit);
          list.appendChild(element);
        });
        sidebarResults.appendChild(list);
      })
      .catch(error => {
        sidebarResults.textContent = `An error occurred: ${error.message}`;
      });
}

// Get relative time from timestamp
function timestampToRelativeTime(timestamp) {
  const now = new Date();
  const date = new Date(timestamp);
  const diff = now - date;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;
  const year = 365 * day;

  if (diff < hour) {
    return Math.floor(diff / minute) + " minute" + (diff < 2 * minute ? "" : "s") + " ago";
  } else if (diff < day) {
    return Math.floor(diff / hour) + " hour" + (diff < 2 * hour ? "" : "s") + " ago";
  } else if (diff < month) {
    return Math.floor(diff / day) + " day" + (diff < 2 * day ? "" : "s") + " ago";
  } else if (diff < year) {
    return Math.floor(diff / month) + " month" + (diff < 2 * month ? "" : "s") + " ago";
  } else {
    return Math.floor(diff / year) + " year" + (diff < 2 * year ? "" : "s") + " ago";
  }
}