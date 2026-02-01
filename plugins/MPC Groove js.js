// MPC_Groove.js
export default {
    name: "AKAI MPC 60",
    /* amount: 0.0 to 1.0 (corresponds to the slider)
       step: 0-15
       Returns: timing offset as a fraction of a beat
    */
    getOffset: function(step, amount) {
        // Classic MPC swing affects every even 16th note (1, 3, 5...)
        if (step % 2 !== 0) {
            // 0.66 is the "Triplet" ratio from your chart (~66%)
            return amount * 0.08; 
        }
        return 0;
    }
}