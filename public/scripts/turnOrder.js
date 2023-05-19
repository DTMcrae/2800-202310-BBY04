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

        this.actors = actors.sort(function (a, b) { return b.roll - a.roll;});
        this.turn = 0;
        this.breakOut = 0;

        let actor = this.currentTurn();

        if(!actor.isActive) this.endTurn();

        if (actor.start !== undefined) actor.start();
    }

    /** Gets the current turn's actor.
     * 
     * @returns Actor:{name,id,roll,start}
     */
    currentTurn() {
        return this.actors[this.turn];
    }

    /** Gets a list of all actors, starting at the current turn onwards.
     * 
     * @returns Array of Actor:{name,id,roll,start}
     */
    getCurrentOrder() {
        let actorList = [];

        for(var i = 0; i < this.actors.length; i++) {
            actorList.push(this.actors[(this.turn + i) % this.actors.length]);
        }

        return actorList;
    }

    /** Ends the current turn, and starts the next one.
     *  If the next turn's actor has a start function, that function is called.
     *  If the actor is not active, moves on to the next one.
     */
    async endTurn() {
        this.turn++;
        this.breakOut++;
        if(this.turn >= this.actors.length) this.turn = 0;

        if(this.breakOut > this.actors.length) {
            console.log("All actors are inactive, unable to progress any further.");
            return false;
        }

        if(!this.currentTurn().isActive)
        {
            return this.endTurn();
        }

        this.breakOut = 0;
        if(this.currentTurn().start !== undefined) await this.currentTurn().start();
        return true;
    }

    /** Gets the actor object for the specified actor.
     * 
     * @param name: the name of the actor.
     * 
     * @returns Actor:{name,id,roll,start}
     */
    getActorData(name)
    {
        var result;
        this.actors.forEach(actor => {
            if(actor.name === name) {
                result = actor;
            }
        });
        return result;
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