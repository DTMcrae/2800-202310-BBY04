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

        var turnOrder = { order: actors.sort(function (a, b) { return b.roll - a.roll; }), turn: 0 };

        let actor = turnOrder.order[turnOrder.turn];

        if (!actor.isActive) this.endTurn(turnOrder);

        if (actor.start !== undefined) actor.start();

        return turnOrder;
    }

    /** Gets the current turn's actor.
     * 
     * @returns Actor:{name,id,roll,start}
     */
    currentTurn(turnOrder) {
        return turnOrder.order[turnOrder.turn];
    }

    /** Ends the current turn, and starts the next one.
     *  If the next turn's actor has a start function, that function is called.
     *  If the actor is not active, moves on to the next one.
     */
    async endTurn(turnOrder) {
        turnOrder.turn++;
        if (turnOrder.turn >= turnOrder.order.length) turnOrder.turn = 0;

        if (!this.currentTurn(turnOrder).isActive) {
            return this.endTurn(turnOrder);
        }

        if (this.currentTurn(turnOrder).start !== undefined) await this.currentTurn(turnOrder).start();
        return true;
    }

    /** Gets the actor object for the specified actor.
     * 
     * @param name: the name of the actor.
     * 
     * @returns Actor:{name,id,roll,start}
     */
    getActorData(turnOrder, name) {
        var result = null;
        turnOrder.order.forEach(actor => {
            if (actor.name == name) {
                result = actor;
            }
        });
        return result;
    }

    getActorDataID(turnOrder, id) {
        var result = null;
        turnOrder.order.forEach(actor => {
            if (actor.combatID == id) {
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
    canActObj(turnOrder, actor) {
        return (actor == this.currentTurn(turnOrder));
    }

    /** Returns true if it is the specified actor's turn.
     *  @param name: The name of the actor
     * @returns true/false
     */
    canActName(turnOrder, name) {
        return (name == this.currentTurn(turnOrder).name);
    }

    /** Returns true if it is the specified actor's turn.
     *  @param id: The id of the actor
     * @returns true/false
     */
    canActID(turnOrder, id) {
        return (id == this.currentTurn(turnOrder).id);
    }
}

module.exports = TurnOrder;