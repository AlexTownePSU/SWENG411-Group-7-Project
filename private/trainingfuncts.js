export async function loadTrainings() {
    const response = await fetch(`api/training/GetTrainingStatus`);
    const data = response.json();
    if(!response.ok){
        console.error('Error loading training sessions,', response.message);
    } else {
        return data; // Return the data array if we get a good API response
    }
}