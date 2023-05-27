async function searchHackerNews(query) {
    const id = (new URLSearchParams(document.location.search)).get("id");
    const url = `https://hn.algolia.com/api/v1/search?similarQuery=${query}`
        + `&tags=` + `story`
        + `&hitsPerPage=` + `6` // number of results displayed
        + `&filters=` + `NOT objectID:` + id; // exclude current submission
    return await fetch(url).then(res => res.json());
}

const HN_Main = document.querySelector('#hnmain > tbody');
const HN_navbar = HN_Main.children[0];
const HN_Content = HN_Main.children[2];
const HN_SubmissionTitle = HN_Content.children[0].querySelector('.titleline>a').textContent;

const sidebar = document.createElement('td');

const sidebarHeading = document.createElement('h2');
sidebarHeading.textContent = 'Relevant Submissions';

const sidebarResults = document.createElement('p')
searchHackerNews(HN_SubmissionTitle)
    .then(result => {
        result.hits.forEach(hit => {
            const div = document.createElement('div');
            div.style.padding = '5px 0';

            const link = document.createElement('a');
            link.href = hit.url;
            link.textContent = hit.title;
            link.style.display = 'block';

            div.appendChild(link);
            div.insertAdjacentHTML('beforeend',
                hit.points + ' points '
                + 'by '
                + `<a href=${'user?id=' + hit.author}>${hit.author}</a>`
                + ' | '
                + `<a href=${'item?id=' + hit.objectID}>${hit.num_comments} comments</a>`
            )
            sidebarResults.appendChild(div);
        });
    })
    .catch(error => {
        sidebarResults.textContent = `An error occurred: ${error.message}`;
    });

// Since we added a new column we need to make navbar span the complete row (all columns)
HN_navbar.children[0].setAttribute('colspan', '100%');

// Style sidebar
sidebar.style.minWidth = '250px';
sidebar.style.width = '25%';
sidebar.style.verticalAlign = 'baseline';

// Append elements
sidebar.appendChild(sidebarHeading);
sidebar.appendChild(sidebarResults);
HN_Content.appendChild(sidebar);