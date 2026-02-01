// Dilla_Drunk_Groove.js
export default {
    name: "J_DILLA_DRUNK",
    /** * amount: 0.0 to 1.0 (corresponds to the slider)
     * step: 0-15
     * Returns: timing offset as a fraction of a 16th note
     */
    getOffset: function(step, amount) {
        // The "Drunk" logic:
        // 1. Every odd step (1, 3, 5...) is delayed significantly (The "Pull")
        if (step % 2 !== 0) {
            return amount * 0.18; 
        }

        // 2. The Backbeat (Snares on 4 and 12) is pushed slightly early (The "Push")
        // This creates that rushed-yet-lazy tension.
        if (step === 4 || step === 12) {
            return -(amount * 0.05);
        }

        return 0;
    }
}