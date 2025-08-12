import { loadTrainings } from "../../private/trainingfuncts";

document.addEventListener("DOMContentLoaded", () => {
    // When training table body loads query the data and populate it
    const trainingTable = document.getElementById("training-body");
    if(trainingTable) {
        let trainings = loadTrainings();
        trainings.array.forEach(training => {
            training.name 
        });
    }
});