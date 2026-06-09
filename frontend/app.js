const API_URL = 'http://localhost:5000/api/workouts';
const PROFILE_URL = 'http://localhost:5000/api/profile';

const routinePresets = {
    "Push Day": [
        "Bench Press (4 Sets)", 
        "Incline Dumbbell Press (3 Sets)", 
        "Overhead Shoulder Press (3 Sets)", 
        "Dumbbell Chest Flyes (3 Sets)", 
        "Tricep Rope Pushdowns (3 Sets)",
        "Dips (3 Sets)"
    ],
    "Pull Day": [
        "Barbell Rows (4 Sets)", 
        "Lat Pulldowns (3 Sets)", 
        "Deadlifts (3 Sets)",
        "Dumbbell Bicep Curls (3 Sets)", 
        "Hammer Curls (3 Sets)",
        "Face Pulls (3 Sets)"
    ],
    "Leg Day": [
        "Barbell Squats (4 Sets)", 
        "Romanian Deadlifts (3 Sets)", 
        "Leg Press (3 Sets)", 
        "Leg Curls (3 Sets)",
        "Standing Calf Raises (4 Sets)"
    ],
    "Shoulder Day": [
        "Seated Barbell Press (4 Sets)",
        "Dumbbell Lateral Raises (4 Sets)",
        "Bent-Over Rear Delt Flyes (3 Sets)",
        "Front Dumbbell Raises (3 Sets)",
        "Barbell Shrugs [Traps] (4 Sets)"
    ],
    "Arms & Forearms": [
        "Barbell Bicep Curls (3 Sets)",
        "Skull Crushers [Triceps] (3 Sets)",
        "Incline Dumbbell Curls (3 Sets)",
        "Tricep Overhead Extensions (3 Sets)",
        "Wrist Curls [Forearms] (3 Sets)",
        "Reverse Grip Barbell Curls [Forearms] (3 Sets)"
    ],
    "Cardio & Core": [
        "Incline Treadmill Run (25 Mins)", 
        "Hanging Leg Raises (3 Sets)", 
        "Plank Holds (3 Sets Max Time)",
        "Russian Twists (3 Sets)"
    ]
};

let activeLocalRoutine = [];
let currentRoutineName = "";

document.getElementById('routineSelector').addEventListener('change', (e) => {
    currentRoutineName = e.target.value;
    if (routinePresets[currentRoutineName]) {
        activeLocalRoutine = routinePresets[currentRoutineName].map(ex => ({ name: ex, completed: false }));
        renderTemporaryRoutine();
    }
});

function renderTemporaryRoutine() {
    const tempContainer = document.getElementById('temporaryRoutineList');
    const commitBtn = document.getElementById('commitRoutineBtn');
    tempContainer.innerHTML = '';

    if (activeLocalRoutine.length === 0) {
        tempContainer.innerHTML = '<p style="color: #888; font-style: italic; font-size: 14px;">Select a split above to populate your tracking sheet.</p>';
        commitBtn.style.display = 'none';
        return;
    }

    commitBtn.style.display = 'block';

    activeLocalRoutine.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = `exercise-item ${item.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <input type="checkbox" ${item.completed ? 'checked' : ''} onchange="toggleExerciseCheck(${index})">
                <span>🏋️‍♂️ ${item.name}</span>
            </div>
            <button class="btn-delete" style="background:#6c757d;" onclick="deleteLocalExercise(${index})">🗑️</button>
        `;
        tempContainer.appendChild(li);
    });
}

function toggleExerciseCheck(index) {
    activeLocalRoutine[index].completed = !activeLocalRoutine[index].completed;
    renderTemporaryRoutine();
}

function addCustomExerciseToRoutine() {
    const input = document.getElementById('customExerciseInput');
    const val = input.value.trim();
    if (!val) return;
    
    activeLocalRoutine.push({ name: val, completed: false });
    input.value = '';
    renderTemporaryRoutine();
}

function deleteLocalExercise(index) {
    activeLocalRoutine.splice(index, 1);
    renderTemporaryRoutine();
}

async function saveEntireRoutineToDatabase() {
    if (activeLocalRoutine.length === 0) return;
    
    const exerciseNamesArray = activeLocalRoutine.map(item => item.name);

    const routinePreviewText = exerciseNamesArray.map((ex, i) => `${i + 1}. ${ex}`).join('\n');
    
    const userIsSure = confirm(
        `🚨 REVIEW YOUR LOG BEFORE SAVING:\n\n` +
        `You are about to save "${currentRoutineName}" with these exercises:\n` +
        `${routinePreviewText}\n\n` +
        `Click OK to lock this into the database, or Cancel to go back and edit!`
    );

    if (!userIsSure) return;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                workout_name: currentRoutineName || "Custom Workout Split", 
                exercises: exerciseNamesArray 
            })
        });

        if (response.ok) {
            alert('🎯 Workout session successfully committed to PostgreSQL history!');
            activeLocalRoutine = [];
            document.getElementById('routineSelector').value = '';
            renderTemporaryRoutine();
            fetchWorkouts();
        }
    } catch (err) {
        console.error('Error batching database posts:', err);
    }
}

async function fetchWorkouts() {
    try {
        const response = await fetch(API_URL);
        const logs = await response.json();
        const historyContainer = document.getElementById('workoutLogHistory');
        historyContainer.innerHTML = '';

        if (logs.length === 0) {
            historyContainer.innerHTML = '<p style="color:#888; text-align:center; font-size:14px;">No training records stored yet.</p>';
            return;
        }

        logs.forEach(log => {
            const date = new Date(log.workout_date).toLocaleDateString();
            const card = document.createElement('div');
            card.className = 'log-card';

            let exerciseListHTML = "";
            if (log.exercises && log.exercises.length > 0) {
                log.exercises.forEach(ex => {
                    exerciseListHTML += `<li>${ex}</li>`;
                });
            } else {
                exerciseListHTML = "<li>No movements tracked.</li>";
            }

            const safeName = log.workout_name.replace(/'/g, "\\'");
            const exerciseString = log.exercises ? log.exercises.join(', ').replace(/'/g, "\\'") : "";

            card.innerHTML = `
                <div class="log-header">
                    <div>
                        <span style="font-size:16px; color:#1a73e8;">📋 ${log.workout_name}</span><br>
                        <small style="color:#777; font-weight:normal;">📅 Logged: ${date}</small>
                    </div>
                    <div class="btn-group">
                        <button class="btn-edit" onclick="editDBWorkoutLog(${log.id}, '${safeName}', '${exerciseString}')">✏️ Edit</button>
                        <button class="btn-delete" onclick="deleteDBWorkout(${log.id})">Remove Log</button>
                    </div>
                </div>
                <ul class="log-exercises">
                    ${exerciseListHTML}
                </ul>
            `;
            historyContainer.appendChild(card);
        });
    } catch (err) {
        console.error('Error pulling logs:', err);
    }
}

async function editDBWorkoutLog(id, currentName, currentExercisesString) {
    const newName = prompt("Update routine group title:", currentName);
    if (newName === null) return; // User cancelled

    const newExercisesString = prompt(
        "Edit your exercises (separated by commas):", 
        currentExercisesString
    );
    if (newExercisesString === null) return; // User cancelled

    const updatedExercisesArray = newExercisesString
        .split(',')
        .map(ex => ex.trim())
        .filter(ex => ex !== "");

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                workout_name: newName.trim() || "Custom Workout Split",
                exercises: updatedExercisesArray
            })
        });

        if (response.ok) {
            fetchWorkouts();
        }
    } catch (err) {
        console.error('Error updating saved database log:', err);
    }
}

async function deleteDBWorkout(id) {
    if (confirm('Permanently remove this entire workout split card from the database?')) {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (res.ok) fetchWorkouts();
    }
}

async function loadProfile() {
    try {
        const response = await fetch(PROFILE_URL);
        const user = await response.json();
        if (user && user.height_cm) {
            document.getElementById('height').value = user.height_cm;
            document.getElementById('weight').value = user.weight_kg;
            document.getElementById('goal').value = user.fitness_goal;
            generateAdvice(user.height_cm, user.weight_kg, user.fitness_goal);
        }
    } catch (error) { console.error(error); }
}

function generateAdvice(height, weight, goal) {
    const aiBox = document.getElementById('aiRecommendation');
    const m = height / 100;
    const bmi = (weight / (m * m)).toFixed(1);
    let txt = `<strong>Current Computed BMI:</strong> ${bmi}<br><br>`;
    if (goal === 'weight_loss') {
        txt += `<strong>🎯 Focus Split advice:</strong> Prioritize <strong>Cardio & Core Focus</strong> or lower-weight splits to burn calories effectively.`;
    } else if (goal === 'muscle_gain') {
        txt += `<strong>🎯 Focus Split advice:</strong> Run a heavy <strong>Push ➡️ Pull ➡️ Legs</strong> alternating split rotation for strength.`;
    } else {
        txt += `<strong>🎯 Focus Split advice:</strong> Rotate across all splits balanced weekly to build endurance.`;
    }
    aiBox.innerHTML = txt;
}

document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const height = document.getElementById('height').value;
    const weight = document.getElementById('weight').value;
    const goal = document.getElementById('goal').value;
    try {
        const response = await fetch(PROFILE_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ height, weight, goal })
        });
        if (response.ok) { alert('Metric Profile Updated!'); generateAdvice(height, weight, goal); }
    } catch (err) { console.error(err); }
});

let countdownInterval = null;

function startRestTimer(seconds) {
    clearInterval(countdownInterval);
    let timeRemaining = seconds;
    updateTimerDisplay(timeRemaining);

    countdownInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay(timeRemaining);

        if (timeRemaining <= 0) {
            clearInterval(countdownInterval);
            document.getElementById('timerDisplay').innerText = "Time's Up! 💪";
            alert("⏰ Rest period over! Time for your next set!");
        }
    }, 1000);
}

function stopRestTimer() {
    clearInterval(countdownInterval);
    document.getElementById('timerDisplay').innerText = "00:00";
}

function updateTimerDisplay(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    document.getElementById('timerDisplay').innerText = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

loadProfile();
fetchWorkouts();
