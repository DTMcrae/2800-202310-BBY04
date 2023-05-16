class TurnOrder {

    /**
     * 
     * @param actors: An array of actors in the turn order.
     * The array should be formatted as such:
     * [{name: name, id: id, roll:roll, start: callback}] Where:
     * 'name' is the actor's name.
     * 'id' is the actor's id.
     * 'roll' is the actor's initiative roll.
     * 'start is the function to call once this actor's turn starts.
     */
    assignNew(actors) {
        function sortOrder(a, b) {
            if (a.roll < b.roll) return 1;

            if (a.roll > b.roll) return -1;

            return 0;
        }

        this.actors = actors.sort(sortOrder);
        console.log("Initiative Order: ", this.actors);
        this.turn = 0;
        if (this.currentTurn().start !== undefined) this.currentTurn().start();
    }

    /** Gets the current turn's actor.
     * 
     * @returns Actor:{name,id,roll,start}
     */
    currentTurn() {
        return this.actors[this.turn];
    }

    /** Ends the current turn, and starts the next one.
     *  If the next turn's actor has a start function, that function is called.
     * 
     */
    async endTurn() {
        this.turn++;
        if(this.turn >= this.actors.length) this.turn = 0;
        if(this.currentTurn().start !== undefined) await this.currentTurn().start();
        return true;
    }

    /** Returns true if it is the specified actor's turn.
     * 'actor' is the actor object with the following format:
     * actor:{name,id,roll,isPlayer,start}
     * @returns true/false
     */
    canActObj(actor)
    {
        return (actor == this.currentTurn());
    }

    /** Returns true if it is the specified actor's turn.
     *  @param name: The name of the actor
     * @returns true/false
     */
    canActName(name) {
        return(name == this.currentTurn().name);
    }

    /** Returns true if it is the specified actor's turn.
     *  @param id: The id of the actor
     * @returns true/false
     */
    canActID(id) {
        return(id == this.currentTurn().id);
    }
}

module.exports = TurnOrder;