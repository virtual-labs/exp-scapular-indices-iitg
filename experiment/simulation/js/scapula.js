/* ==============================
   CONFIGURATION
============================== */

const CM_PER_PIXEL = 0.0369;

/* SCAPULA TARGET VALUES */
const TARGETS = {
    length: {
        val: 12.25, tol: 1, unit: "cm",
        instr: "Measure maximum length of scapula from superior to inferior angle using osteometric board."
    },
    breadth: {
        val: 11.76, tol: 1, unit: "cm",
        instr: "Measure maximum breadth of scapula using sliding calipers."
    },
    spine: {
        val: 9.88, tol: 0.8, unit: "cm",
        instr: "Measure length of scapular spine using sliding calipers."
    },
    glenoid_len: {
        val: 2.92, tol: 0.3, unit: "cm",
        instr: "Measure supero-inferior diameter of the glenoid cavity."
    },
    glenoid_br: {
        val: 2.32, tol: 0.3, unit: "cm",
        instr: "Measure antero-posterior diameter of the glenoid cavity."
    },
    supra: {
        val: 110, tol: 5, unit: "deg",
        instr: "Measure supraspinous angle using goniometer."
    },
    infra: {
        val: 100, tol: 5, unit: "deg",
        instr: "Measure infraspinous angle using goniometer."
    },
    indices: {
        val: 0,
        tol: 0,
        unit: "",
        instr: "Enter measured values to calculate scapula indices."
    }
};

/* ==============================
   REAL SCAPULA VALUES (HIDDEN)
============================== */

const REAL_SCAPULA = {
    length: 12.25,
    breadth: 11.76,
    spine: 9.88,
    glenoid_len: 2.99,
    glenoid_br: 2.32
};

/* AUTO POSITIONING OF SCAPULA */
const BONE_POSES = {
    length:      { left: "200px", top: "80px",  rotate:  90 },
    breadth:     { left: "200px", top: "160px", rotate: 90 },
    spine:       { left: "200px", top: "160px", rotate: 0 },
    glenoid_len: { left: "200px", top: "140px", rotate: 90 },
    glenoid_br:  { left: "200px", top: "140px", rotate: 15 },
    supra:       { left: "200px", top: "120px", rotate: 0 },
    infra:       { left: "200px", top: "120px", rotate: 0 }
};

/* ==============================
   STATE VARIABLES
============================== */

let currentMode = "length";

let boneLocked = true;

let currentReading = 0;
let dragged = null;
let rotatingArm = null;

let offset = { x: 0, y: 0 };
/* ==============================
   MODE SWITCHING
============================== */

function setMode(mode, event) {

    currentMode = mode;

    document.querySelectorAll(".nav-btn")
        .forEach(btn => btn.classList.remove("active"));

    if (event) event.target.classList.add("active");

    ["tool-board","tool-caliper","tool-tape","tool-goniometer","tool-indices"]
        .forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = "none";
        });

    document.getElementById("feedback").innerText = "";
    document.getElementById("readout").innerText = 0;
    currentReading = 0;

   if (mode === "indices") {

        document.getElementById("tool-indices").style.display = "block";

        // Hide controls and bone on Indices page
        document.getElementById("controls").style.display = "none";
        document.getElementById("bone").style.display = "none";

        return;
    }

    // Hide controls for Length and Breadth
    if (mode === "length") {
        document.getElementById("controls").style.display = "none";
    } else {
        document.getElementById("controls").style.display = "block";
    }

    document.getElementById("bone").style.display = "block";

    document.getElementById("bone").style.display = "block";

    document.getElementById("instruction").innerText =
        TARGETS[mode].instr;

    document.getElementById("unit").innerText =
        TARGETS[mode].unit;

    const bone = document.getElementById("bone");
    const pose = BONE_POSES[mode];

    bone.style.left = pose.left;
    bone.style.top = pose.top;
    bone.style.transform = `rotate(${pose.rotate}deg)`;
    if (
        mode === "breadth" ||
        mode === "spine" ||
        mode === "glenoid_len" ||
        mode === "glenoid_br" ||
        mode === "supra" ||
        mode === "infra"
    ) {

        boneLocked = true;

        bone.style.cursor = "default";
        bone.style.boxShadow = "none";

    }
    else {

        boneLocked = false;

        bone.style.cursor = "grab";
    }
    if (mode === "length") {
        document.getElementById("tool-board").style.display = "block";
        document.getElementById("movable-wall").style.left = "420px";
    }
    else if (
        ["breadth","spine","glenoid_len","glenoid_br"].includes(mode)
    ) {
        document.getElementById("tool-caliper").style.display = "block";
    }
    else {
        document.getElementById("tool-goniometer").style.display = "block";
    }
}


/* ==============================
   DRAG + ROTATION LOGIC
============================== */

document.addEventListener("mousedown", e => {

    /* ---------- BASIC DRAG TOOLS ---------- */
 if (
    (e.target.id === "bone" && !boneLocked) ||
    e.target.id === "movable-wall"
) {

    dragged = e.target;

    const rect = dragged.getBoundingClientRect();

    offset.x = e.clientX - rect.left;
    offset.y = e.clientY - rect.top;
}

/* MOVE WHOLE CALIPER */
    else if (
        e.target.closest("#tool-caliper") &&
        !e.target.closest("#caliper-slider")
    ) {

        dragged = document.getElementById("tool-caliper");

        const rect = dragged.getBoundingClientRect();

        offset.x = e.clientX - rect.left;
        offset.y = e.clientY - rect.top;
    }

    /* MOVE CALIPER SLIDER */
    else if (e.target.closest("#caliper-slider")) {

        dragged = document.getElementById("caliper-slider");

        const rect = dragged.getBoundingClientRect();

        offset.x = e.clientX - rect.left;
        offset.y = e.clientY - rect.top;
    }

    if (e.target.closest("#goniometer") &&
        !e.target.classList.contains("gonio-arm")) {

        dragged = document.getElementById("goniometer");
        const rect = dragged.getBoundingClientRect();
        offset.x = e.clientX - rect.left;
        offset.y = e.clientY - rect.top;
    }

    if (e.target.classList.contains("gonio-arm")) {
        rotatingArm = e.target;
    }
});

document.addEventListener("mousemove", e => {

    /* ---- DRAGGING ---- */
    if (dragged) {
        const workspace = document.getElementById("workspace").getBoundingClientRect();
        /* BOARD */
        if (currentMode === "length" && dragged.id === "movable-wall") {
            const workspace = document.getElementById("workspace").getBoundingClientRect();
            let x = e.clientX - workspace.left;
            x = Math.max(120, Math.min(x, 820));
            dragged.style.left = x + "px";
            currentReading = ((x - 120) * CM_PER_PIXEL).toFixed(2);

        }

      /* BONE DRAGGING */
        else if (dragged.id === "bone") {

            let x = e.clientX - workspace.left - offset.x;
            let y = e.clientY - workspace.top - offset.y;

            dragged.style.left = x + "px";
            dragged.style.top  = y + "px";
        }
        /* CALIPER */
        /* MOVE WHOLE CALIPER */
        else if (dragged.id === "tool-caliper") {

            let x = e.clientX - workspace.left - offset.x;
            let y = e.clientY - workspace.top - offset.y;

            dragged.style.left = x + "px";
            dragged.style.top = y + "px";
        }
        else if (dragged.id === "caliper-slider") {

        const caliperBody =
            document.getElementById("caliper-body")
            .getBoundingClientRect();

        let x = e.clientX - caliperBody.left - offset.x;

        const minX = 60;
        const maxX = 520;

        if (x < minX) x = minX;
        if (x > maxX) x = maxX;

        dragged.style.left = x + "px";

        /* measurement calculation */
        const fixedJawX = 40;
        const distancePx = x - fixedJawX;

        currentReading = distancePx * (1/40.9) ;
    }
        /* GONIOMETER BODY */
        else if (dragged.id === "goniometer") {

            let x = e.clientX - workspace.left - offset.x;
            let y = e.clientY - workspace.top - offset.y;

            dragged.style.left = x + "px";
            dragged.style.top  = y + "px";
        }

        document.getElementById("readout").innerText =
            parseFloat(currentReading).toFixed(2);
    }

    /* ROTATION */
    if (rotatingArm) {

        const center = document.getElementById("gonio-center").getBoundingClientRect();
        const cx = center.left + center.width / 2;
        const cy = center.top  + center.height / 2;

        const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI;
        rotatingArm.style.transform = `rotate(${angle}deg)`;

        const a1 = getRotation(document.getElementById("gonio-arm-1"));
        const a2 = getRotation(document.getElementById("gonio-arm-2"));

        let diff = Math.abs(a1 - a2);
        if (diff > 180) diff = 360 - diff;

        currentReading = Math.round(diff);
        document.getElementById("readout").innerText = currentReading;
    }
});

document.addEventListener("mouseup", () => {
    dragged = null;
    rotatingArm = null;
});

/* ==============================
   UTILITIES
============================== */

function getRotation(el) {
    if (!el.style.transform) return 0;
    return parseFloat(el.style.transform.replace("rotate(", "").replace("deg)", ""));
}
/* ==============================
   CORRECT SCAPULA INDICES
============================== */

const CORRECT_INDICES = {

    ans_scap: 92.24,

    ans_glenoid: 71.92,

    ans_spine_br: 85.68,

    ans_spine_len: 78.72
};
/* ==============================
   CALCULATE + VALIDATE
============================== */

function calculate(numId, denId, ansId) {

    const num = parseFloat(
        document.getElementById(numId).value
    );

    const den = parseFloat(
        document.getElementById(denId).value
    );

    const ans =
        document.getElementById(ansId);

    /* Empty fields */
    if (
        isNaN(num) ||
        isNaN(den) ||
        den === 0
    ) {

        ans.value = "";

        ans.style.background = "#fff8dc";
        ans.style.border = "2px solid #f1c40f";
        ans.style.color = "black";

        return;
    }

    /* Calculate */
    const result = (num * 100) / den;

    ans.value = result.toFixed(2);

    /* Check */
    const correct = CORRECT_INDICES[ansId];

    const tolerance = 0.2;

    if (Math.abs(result - correct) <= tolerance) {

        ans.style.background = "#d4edda";
        ans.style.border = "3px solid green";
        ans.style.color = "green";

    } else {

        ans.style.background = "#f8d7da";
        ans.style.border = "3px solid red";
        ans.style.color = "red";
    }
}
/* ==============================
   LIVE UPDATE
============================== */

document.addEventListener("input", () => {

    calculate(
        "scap_num",
        "scap_den",
        "ans_scap"
    );

    calculate(
        "glenoid_num",
        "glenoid_den",
        "ans_glenoid"
    );

    calculate(
        "spine_num1",
        "spine_den1",
        "ans_spine_br"
    );

    calculate(
        "spine_num2",
        "spine_den2",
        "ans_spine_len" 
    );

});
/* ==============================
   CHECK RESULT
============================== */

function checkMeasurement() {
    const t = TARGETS[currentMode];
    const fb = document.getElementById("feedback");

    if (Math.abs(currentReading - t.val) <= t.tol) {
        fb.style.color = "green";
        fb.innerText = "✔ Correct measurement.";
    } else {
        fb.style.color = "red";
        fb.innerText = `✖ Incorrect. Accepted value ≈ ${t.val} ${t.unit}`;
    }
}
function checkIndices() {

    const tolerance = 0.5;

    const L = REAL_SCAPULA.length;
    const B = REAL_SCAPULA.breadth;
    const S = REAL_SCAPULA.spine;
    const GL = REAL_SCAPULA.glenoid_len;
    const GB = REAL_SCAPULA.glenoid_br;

    const correct = {
        scap: (B * 100) / L,
        glenoid: (GB * 100) / GL,
        spine_br: (S * 100) / B,
        spine_len: (S * 100) / L
    };

    const user = {
        scap: parseFloat(document.getElementById("ans_scap").value),
        glenoid: parseFloat(document.getElementById("ans_glenoid").value),
        spine_br: parseFloat(document.getElementById("ans_spine_br").value),
        spine_len: parseFloat(document.getElementById("ans_spine_len").value)
    };

    let score = 0;
    let total = 4;

    for (let key in correct) {

        const input = document.getElementById("ans_" + key);

        if (Math.abs(user[key] - correct[key]) <= tolerance) {

            input.style.border = "3px solid green";
            input.style.backgroundColor = "#e6ffe6";
            score++;

        } else {

            input.style.border = "3px solid red";
            input.style.backgroundColor = "#ffe6e6";
        }
    }

    const feedback = document.getElementById("indexFeedback");

    if (score === total) {
        feedback.style.color = "green";
        feedback.innerHTML =
            `✔ Excellent! All calculations correct. (${score}/4)`;
    }
    else {
        feedback.style.color = "red";
        feedback.innerHTML =
            `✖ Some calculations are incorrect.<br>Score: ${score}/4`;
    }
}
function createScale() {

    const scale =
        document.getElementById("scale");

    scale.innerHTML = "";

    const PX_PER_CM = 34.5;

    /* 40 cm scale with 0.1 cm divisions */
    for (let i = 0; i <= 200; i++) {

        const value = i / 10;

        const tick =
            document.createElement("div");

        tick.classList.add("tick");

        tick.style.left =
            (value * PX_PER_CM) + "px";

        /* Tick types */

        /* Every 1 cm */
        if (i % 10 === 0) {

            tick.classList.add("large");

            const label =
                document.createElement("div");

            label.classList.add("tick-label");

            label.style.left =
                (value * PX_PER_CM - 6) + "px";

            label.innerText = value.toFixed(0);

            scale.appendChild(label);
        }

        /* Every 0.5 cm */
        else if (i % 5 === 0) {

            tick.classList.add("medium");
        }

        /* Every 0.1 cm */
        else {

            tick.classList.add("small");
        }

        scale.appendChild(tick);
    }
}
// function createCaliperScale() {

//     const scale = document.querySelector(".caliper-scale");

//     scale.innerHTML = "";

//     const PX_PER_CM = 20;

//     for (let i = 0; i <= 20; i++) {

//         const tick = document.createElement("div");

//         tick.classList.add("cal-tick");

//         tick.style.left = (i * PX_PER_CM) + "px";

//         if (i % 10 === 0) {
//             tick.classList.add("large");
//         }
//         else if (i % 5 === 0) {
//             tick.classList.add("medium");
//         }
//         else {
//             tick.classList.add("small");
//         }

//         scale.appendChild(tick);

//         /* labels every 1 cm */
//         const label = document.createElement("div");

//         label.classList.add("cal-label");

//         label.style.left = (i * PX_PER_CM - 4) + "px";

//         label.innerText = i;

//         scale.appendChild(label);
//     }
// }
/* ==============================
   GONIOMETER SCALE
============================== */

function createGonioScale() {

    const scale =
        document.getElementById("gonio-scale");

    scale.innerHTML = "";

    const radius = 78;

    for (let deg = 0; deg < 360; deg += 5) {

        const tick =
            document.createElement("div");

        tick.classList.add("gonio-tick");

        let tickLength = 6;

        if (deg % 10 === 0) {
            tickLength = 12;
        }

        const angle =
            (deg - 90) * Math.PI / 180;

        const x =
            90 + radius * Math.cos(angle);

        const y =
            90 + radius * Math.sin(angle);

        tick.style.left = x + "px";
        tick.style.top = y + "px";

        tick.style.height = tickLength + "px";

        tick.style.transform =
            `translate(-50%, -100%) rotate(${deg}deg)`;

        scale.appendChild(tick);

        /* labels */
        if (deg % 20 === 0) {

            const label =
                document.createElement("div");

            label.classList.add("gonio-label");

            label.innerText = deg;

            const lx =
                90 + (radius - 18) * Math.cos(angle);

            const ly =
                90 + (radius - 18) * Math.sin(angle);

            label.style.left = lx + "px";
            label.style.top = ly + "px";

            scale.appendChild(label);
        }
    }
}

const bone = document.getElementById("bone");

/* Disable browser drag image */
bone.ondragstart = () => false;

/* Double-click lock/unlock */
bone.addEventListener("dblclick", () => {

    const fixedModes = [
        "breadth",
        "spine",
        "glenoid_len",
        "glenoid_br",
        "supra",
        "infra"
    ];

    if (fixedModes.includes(currentMode)) {
        return;
    }

    boneLocked = !boneLocked;

    if (!boneLocked) {

        bone.style.cursor = "grab";

        bone.style.boxShadow =
            "0 8px 20px rgba(0,0,0,0.25)";

    } else {

        bone.style.cursor = "default";
        bone.style.boxShadow = "none";
    }
});
/* ==============================
   INITIAL LOAD
============================== */

setMode("length");
createScale();
// createCaliperScale();
createGonioScale();