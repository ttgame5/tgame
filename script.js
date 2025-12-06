document.addEventListener("DOMContentLoaded", () => {
    fetchData();
});

// List of all teams to ensure they appear in table even if they haven't played
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
        document.querySelector('main').innerHTML = "<p>Error loading match data. Please ensure matches.json is present.</p>";
    }
}

function calculateAndRender() {
    // 1. Initialize Stats object
    let stats = {};
    teamNames.forEach(team => {
        stats[team] = {
            name: team,
            matches: 0,
            won: 0,
            lost: 0,
            points: 0,
            setsFor: 0,
            setsAgainst: 0
        };
    });

    // 2. Process Matches
    const resultsContainer = document.getElementById('results-list');
    const upcomingContainer = document.getElementById('upcoming-list');

    matchesData.forEach(match => {
        if (match.played) {
            // Update Stats
            updateTeamStats(stats, match.t1, match.s1, match.s2);
            updateTeamStats(stats, match.t2, match.s2, match.s1);

            // Render Result Card
            resultsContainer.innerHTML += createMatchCard(match);
        } else {
            // Render Upcoming Card
            upcomingContainer.innerHTML += createMatchCard(match);
        }
    });

    // 3. Convert Stats Object to Array and Sort
    let tableData = Object.values(stats);

    tableData.sort((a, b) => {
        // Priority 1: Points (Higher is better)
        if (b.points !== a.points) return b.points - a.points;
        // Priority 2: Set Difference (Calculated: For - Against)
        let diffA = a.setsFor - a.setsAgainst;
        let diffB = b.setsFor - b.setsAgainst;
        return diffB - diffA;
    });

    // 4. Render Table
    const tableBody = document.querySelector('#standings-table tbody');
    tableData.forEach((team, index) => {
        let diff = team.setsFor - team.setsAgainst;
        let diffDisplay = diff > 0 ? `+${diff}` : diff;
        
        let row = `
            <tr>
                <td>${index + 1}</td>
                <td>${team.name}</td>
                <td>${team.matches}</td>
                <td>${team.won}</td>
                <td>${team.lost}</td>
                <td><strong>${team.points}</strong></td>
                <td>${diffDisplay}</td>
                <td>${team.setsFor} / ${team.setsAgainst}</td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}

function updateTeamStats(stats, teamName, myScore, oppScore) {
    if(!stats[teamName]) return; // Safety check

    stats[teamName].matches += 1;
    stats[teamName].setsFor += myScore;
    stats[teamName].setsAgainst += oppScore;

    if (myScore > oppScore) {
        stats[teamName].won += 1;
        stats[teamName].points += 2;
    } else {
        stats[teamName].lost += 1;
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

// Tab Switching Logic
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));
    // Remove active class from buttons
    document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));

    // Show selected
    document.getElementById(sectionId).classList.remove('hidden');
    document.getElementById(`btn-${sectionId}`).classList.add('active');
}
