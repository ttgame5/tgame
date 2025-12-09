document.addEventListener("DOMContentLoaded", () => {
    fetchData();
});

const teamNames = [
    "Ilavatta Pasanga", "Saravedi", "Legends", "Silent Kings", 
    "Alapparai", "Baasha", "Prince Warriors"
];

let matchesData = [];

async function fetchData() {
    try {
        const response = await fetch('matches.json');
        matchesData = await response.json();
        calculateAndRender();
    } catch (error) {
        console.error("Error loading data:", error);
    }
}

function calculateAndRender() {
    // 1. Initialize Stats
    let stats = {};
    teamNames.forEach(team => {
        stats[team] = {
            name: team,
            matches: 0,
            won: 0,
            lost: 0,
            points: 0,
            setsFor: 0,
            setsAgainst: 0,
            history: [] // Array to store match details for the dropdown
        };
    });

    // 2. Process Matches
    const resultsContainer = document.getElementById('results-list');
    const upcomingContainer = document.getElementById('upcoming-list');

    // Clear previous content
    resultsContainer.innerHTML = '';
    upcomingContainer.innerHTML = '';

    matchesData.forEach(match => {
        // Handle Standings Data (history)
        if (match.played) {
            updateTeamStats(stats, match.t1, match.s1, match.s2, match.t2, match.id);
            updateTeamStats(stats, match.t2, match.s2, match.s1, match.t1, match.id);
            resultsContainer.innerHTML += createMatchCard(match);
        } else {
            upcomingContainer.innerHTML += createMatchCard(match);
        }
    });

    // 3. Sort Table
    let tableData = Object.values(stats);
    tableData.sort((a, b) => {
        if (b.won !== a.won) return b.won - a.won; // Priority 1: Matches Won
        let diffA = a.setsFor - a.setsAgainst;
        let diffB = b.setsFor - b.setsAgainst;
        return diffB - diffA; // Priority 2: Point Difference
    });

    // 4. Render Table
    const tableBody = document.querySelector('#standings-table tbody');
    tableBody.innerHTML = '';

    tableData.forEach((team, index) => {
        let diff = team.setsFor - team.setsAgainst;
        let diffDisplay = diff > 0 ? `+${diff}` : diff;
        
        // Sanitize team name for ID (remove spaces)
        let teamIdSafe = team.name.replace(/\s+/g, '-').toLowerCase();

        // Main Row
        let mainRow = `
            <tr class="main-row">
                <td>${index + 1}</td>
                <td class="team-name-cell" onclick="toggleDetails('${teamIdSafe}')">
                    ${team.name} <span class="toggle-icon">▼</span>
                </td>
                <td>${team.matches}</td>
                <td>${team.won}</td>
                <td>${team.lost}</td>
                <td><strong>${team.points}</strong></td>
                <td>${diffDisplay}</td>
                <td>${team.setsFor} / ${team.setsAgainst}</td>
            </tr>
        `;

        // Details Row (Hidden by default)
        let historyHtml = team.history.map(h => 
            `<div class="history-item ${h.result}">
                <span>Match ${h.matchId} vs <strong>${h.opponent}</strong></span>
                <span>${h.scoreOwn}-${h.scoreOpp} (${h.result})</span>
            </div>`
        ).join('');

        if(historyHtml === '') historyHtml = '<div class="no-history">No matches played yet.</div>';

        let detailsRow = `
            <tr id="details-${teamIdSafe}" class="details-row hidden">
                <td colspan="8">
                    <div class="details-container">
                        ${historyHtml}
                    </div>
                </td>
            </tr>
        `;

        tableBody.innerHTML += mainRow + detailsRow;
    });
}

function updateTeamStats(stats, teamName, myScore, oppScore, opponentName, matchId) {
    if(!stats[teamName]) return;

    stats[teamName].matches += 1;
    stats[teamName].setsFor += myScore;
    stats[teamName].setsAgainst += oppScore;

    let result = '';
    if (myScore > oppScore) {
        stats[teamName].won += 1;
        stats[teamName].points += 2;
        result = 'WON';
    } else {
        stats[teamName].lost += 1;
        result = 'LOST';
    }

    // Add to history for the toggle view
    stats[teamName].history.push({
        matchId: matchId,
        opponent: opponentName,
        scoreOwn: myScore,
        scoreOpp: oppScore,
        result: result
    });
}

// ... createMatchCard and showSection functions remain the same as previous code ...

function toggleDetails(teamId) {
    const row = document.getElementById(`details-${teamId}`);
    if (row.classList.contains('hidden')) {
        row.classList.remove('hidden');
    } else {
        row.classList.add('hidden');
    }
}

function createMatchCard(match) {
    if (match.played) {
        let winner = match.s1 > match.s2 ? match.t1 : match.t2;
        return `
            <div class="match-card">
                <div class="match-number">Match ${match.id}</div>
                <div class="match-teams">${match.t1} vs ${match.t2}</div>
                <div class="match-score">${match.s1} - ${match.s2}</div>
                <div class="match-summary">${winner} won the match. ${match.t1} scored ${match.s1} and ${match.t2} scored ${match.s2}.</div>
            </div>
        `;
    } else {
        return `
            <div class="match-card upcoming">
                <div class="match-number">Match ${match.id}</div>
                <div class="match-teams">${match.t1} vs ${match.t2}</div>
                <div class="match-summary">Upcoming</div>
            </div>
        `;
    }
}

function showSection(sectionId) {
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));
    document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(sectionId).classList.remove('hidden');
    document.getElementById(`btn-${sectionId}`).classList.add('active');
}
