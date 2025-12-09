document.addEventListener("DOMContentLoaded", () => {
    fetchData();
});

// List of all teams ensures they appear in the table even with 0 matches played
const teamNames = [
    "Ilavatta Pasanga", 
    "Saravedi", 
    "Legends", 
    "Silent Kings", 
    "Alapparai", 
    "Baasha", 
    "Prince Warriors"
];

let matchesData = [];

// 1. Fetch JSON Data
async function fetchData() {
    try {
        // Ensure matches.json is in the same folder
        const response = await fetch('matches.json');
        if (!response.ok) throw new Error("HTTP error " + response.status);
        matchesData = await response.json();
        calculateAndRender();
    } catch (error) {
        console.error("Error loading data:", error);
        document.querySelector('main').innerHTML = `
            <div style="text-align:center; padding:20px; color:red;">
                <h3>Error Loading Data</h3>
                <p>Could not load matches.json. Please ensure the file exists in the repository.</p>
            </div>`;
    }
}

// 2. Calculation Logic
function calculateAndRender() {
    // Initialize Stats Object for all teams
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
            history: [] // Stores match history for the dropdown
        };
    });

    const resultsContainer = document.getElementById('results-list');
    const upcomingContainer = document.getElementById('upcoming-list');

    // Clear loading text
    if(resultsContainer) resultsContainer.innerHTML = '';
    if(upcomingContainer) upcomingContainer.innerHTML = '';

    // Loop through all matches in JSON
    matchesData.forEach(match => {
        if (match.played) {
            // Update stats for Team 1
            updateTeamStats(stats, match.t1, match.s1, match.s2, match.t2, match.id);
            // Update stats for Team 2
            updateTeamStats(stats, match.t2, match.s2, match.s1, match.t1, match.id);

            // Render to "Results" tab
            if(resultsContainer) resultsContainer.innerHTML += createMatchCard(match);
        } else {
            // Render to "Upcoming" tab
            if(upcomingContainer) upcomingContainer.innerHTML += createMatchCard(match);
        }
    });

    // Sort Standings
    let tableData = Object.values(stats);
    tableData.sort((a, b) => {
        // Priority 1: Points (Higher is better)
        if (b.points !== a.points) return b.points - a.points;
        
        // Priority 2: Set Difference (Calculated)
        let diffA = a.setsFor - a.setsAgainst;
        let diffB = b.setsFor - b.setsAgainst;
        return diffB - diffA;
    });

    renderTable(tableData);
}

// Helper: Update specific team stats object
function updateTeamStats(stats, teamName, myScore, oppScore, opponentName, matchId) {
    if(!stats[teamName]) return; // Safety check

    stats[teamName].matches += 1;
    stats[teamName].setsFor += myScore;
    stats[teamName].setsAgainst += oppScore;

    let matchResult = '';

    if (myScore > oppScore) {
        stats[teamName].won += 1;
        stats[teamName].points += 2;
        matchResult = 'WON';
    } else {
        stats[teamName].lost += 1;
        matchResult = 'LOST';
    }

    // Add detail to history array
    stats[teamName].history.push({
        id: matchId,
        opponent: opponentName,
        score: `${myScore}-${oppScore}`,
        result: matchResult
    });
}

// 3. Render the HTML Table
function renderTable(data) {
    const tableBody = document.querySelector('#standings-table tbody');
    if(!tableBody) return;

    tableBody.innerHTML = '';

    data.forEach((team, index) => {
        let diff = team.setsFor - team.setsAgainst;
        let diffDisplay = diff > 0 ? `+${diff}` : diff;
        
        // Create a safe ID string (e.g., "Legends" -> "legends", "Team A" -> "team-a")
        let teamIdSafe = team.name.replace(/\s+/g, '-').toLowerCase();

        // 1. Main Row
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

        // 2. Details Row (Hidden List)
        let historyHtml = '';
        if (team.history.length > 0) {
            historyHtml = team.history.map(h => `
                <div class="history-item ${h.result}">
                    <span>M${h.id} vs <strong>${h.opponent}</strong></span>
                    <span>${h.score} (${h.result})</span>
                </div>
            `).join('');
        } else {
            historyHtml = '<div class="no-history">No matches played yet.</div>';
        }

        let detailsRow = `
            <tr id="details-${teamIdSafe}" class="details-row hidden">
                <td colspan="8">
                    <div class="details-container">
                        <strong>Match History:</strong>
                        ${historyHtml}
                    </div>
                </td>
            </tr>
        `;

        tableBody.innerHTML += mainRow + detailsRow;
    });
}

// 4. Toggle Logic (Clicking Team Name)
function toggleDetails(teamId) {
    const row = document.getElementById(`details-${teamId}`);
    if (row) {
        // Toggle the hidden class
        if (row.classList.contains('hidden')) {
            row.classList.remove('hidden');
        } else {
            row.classList.add('hidden');
        }
    }
}

// 5. Generate Match Card HTML
function createMatchCard(match) {
    if (match.played) {
        let winner = match.s1 > match.s2 ? match.t1 : match.t2;
        return `
            <div class="match-card">
                <div class="match-number">Match ${match.id}</div>
                <div class="match-teams">${match.t1} vs ${match.t2}</div>
                <div class="match-score">${match.s1} - ${match.s2}</div>
                <div class="match-summary">
                    Winner: <strong>${winner}</strong>. (${match.t1}: ${match.s1}, ${match.t2}: ${match.s2})
                </div>
            </div>
        `;
    } else {
        return `
            <div class="match-card upcoming">
                <div class="match-number">Match ${match.id}</div>
                <div class="match-teams">${match.t1} vs ${match.t2}</div>
                <div class="match-summary">Scheduled</div>
            </div>
        `;
    }
}

// 6. Tab Switching Logic
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));
    
    // Remove active class from buttons
    document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));

    // Show selected section
    const selectedSection = document.getElementById(sectionId);
    if(selectedSection) selectedSection.classList.remove('hidden');
    
    // Highlight button
    const selectedBtn = document.getElementById(`btn-${sectionId}`);
    if(selectedBtn) selectedBtn.classList.add('active');
}
