const GITHUB_TOKEN = '';
const PER_PAGE = 45;

async function fetchUserData(user) {
    const headers = {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
    };

    const response = await fetch(user.url, { headers: headers });
    const userData = await response.json();
    return {
        name: userData.name || 'N/A',  // for no usernames
        username: userData.login,
        location: userData.location,
        profile_url: userData.html_url
    };
}

async function getStargazersLocation(repoOwner, repoName) {
    const headers = {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
    };

    let user_data_list = [];
    let page = 1;

    while (true) {
        const url = `https://api.github.com/repos/${repoOwner}/${repoName}/stargazers?page=${page}&per_page=${PER_PAGE}`;
        const response = await fetch(url, { headers: headers });
        const stargazers = await response.json();

        if (!stargazers.length) break;

        // run asyc
        const userDetailsPromises = stargazers.map(fetchUserData);
        const userDetails = await Promise.all(userDetailsPromises);
        user_data_list = user_data_list.concat(userDetails.filter(user => user.location));

        page += 1;
        if (page > 25) break; // watch for limits
    }

    return user_data_list;
}

function downloadCSV(data) {
    const csvContent = "data:text/csv;charset=utf-8," 
        + "Name,Username,Country,Profile URL\n" 
        + data.map(user => `${user.name},${user.username},Australia,${user.profile_url}`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "stargazers.csv");
    document.body.appendChild(link);
    link.click();
}

async function main() {
    const repoUrl = prompt("Enter the full URL to the GitHub repository:");
    const [_, repoOwner, repoName] = repoUrl.match(/https:\/\/github.com\/([^/]+)\/([^/]+)/);

    const data = await getStargazersLocation(repoOwner, repoName);
    const australianCities = ["Australia", "Brisbane", "Sydney", "Melbourne", "Perth", "Adelaide"];
    const filteredData = data.filter(user => australianCities.some(city => user.location && user.location.toLowerCase().includes(city.toLowerCase())));

    downloadCSV(filteredData);
}

main();
