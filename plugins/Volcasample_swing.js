/**
 * VOLCA SAMPLE SWING ENGINE
 * Based on the hardware ratio chart:
 * 0   = 1:1 (Straight)
 * 20  = 3:2 (Quintuplet)
 * 33  = 2:1 (Triplet)
 * 50  = 3:1 (Dotted 8th)
 * 75  = 7:1 (Double-dotted 8th)
 */

export default {
    name: "KORG VOLCA SAMPLE",
    
    /**
     * @param {number} step - Current sequencer step (0-15)
     * @param {number} amount - Slider value (0.0 to 1.0)
     * @returns {number} Offset in fractions of a beat
     */
    getOffset: function(step, amount) {
        // Volca swing primarily shifts the "off-beats" (even steps)
        if (step % 2 !== 0) {
            
            // We scale the offset to reach the 75% "Double-dotted" 
            // mark at maximum slider travel.
            // 0.125 represents a full 32nd note shift at max swing.
            const maxShift = 0.125; 
            
            return amount * maxShift;
        }
        
        return 0;
    }
}