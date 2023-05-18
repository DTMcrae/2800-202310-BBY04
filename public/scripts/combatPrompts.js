const express = require('express');

class CombatPrompts {

    //The 'system' prompt sent to chatGPT to define rules for the description of player actions.
    playerSystemPrompt() {
        let prompt = `You are the dungeon master for a D&D 5E combat encounter. You must describe what a character does based on the action they give you. Do not describe actions other than what is given.`;
        prompt += `Calculate and provide the damage done and the remaining HP of the targets. Use the AC and HP provided by the user. Damage should not be dealt if the AttackRoll is lower than the AC. All communication must be in JSON format. Leave any comments in a separate JSON field.`

        return prompt;
    }

    //The 'system' prompt sent to chatGPT to define rules for the action generation of enemies.
    enemySystemPrompt() {
        let prompt = `You are the dungeon master for a D&D 5E combat encounter. You must allow the player to decide their actions and spells. Do not roll for the player. You are in control of the Enemy's action. If you wish to attack, you may choose one of the valid targets.`
        prompt += `Calculate and provide the damage done and the remaining HP of the selected target. Use the AC and HP provided by the user. All communication should be in JSON format. Only respond with the Result field. Leave any comments in a separate JSON field.`

        return prompt;
    }

    //The 'system' prompt sent to chatGPT to define rules for the victory/defeat outro generation.
    storySystemPrompt() {
        let prompt = `You are the dungeon master for a D&D 5E game. Combat has just finished, and you are going to give a description of the outcome of the fight. Assume that there are no characters other than what is given to you by the user. The winning side can be found in CombatResult. You will fill out CombatOutro with your description. All communication should be in JSON format. Only respond with the Result field. Leave any comments in a separate JSON field.`;

        return prompt;
    }

    //The 'user' prompt sent to chatGPT to create an outro for obtaining victory in combat.
    combatVictoryPrompt(friendlyActors, enemyActors, history) {
        let prompt = `{
            "Players": [`
            friendlyActors.forEach(actor => {
                prompt += `{
                    "Name": "${actor.name}",
                    "Class": "${actor.class}",
                    "HP": "${actor.hp}"
                },`
            });
            prompt +=
            `],
            "Enemies": [`
            enemyActors.forEach(actor => {
            prompt += `{
                    "Name": "${actor.name}",
                    "Class": "${actor.class}",
                    "HP": "${actor.hp}"
                },`
        });
            prompt +=
            `],
            "Summary": ${history},
            "Result": {
                "CombatResult": "Player Victory",
                "CombatOutro": "Unknown"
            }
        }`;

        return prompt;
    };

    //The 'user' prompt sent to chatGPT to create an outro for falling in combat.
    combatDefeatPrompt(friendlyActors, enemyActors, history) {
        let prompt = `{
            "Players": [`
        friendlyActors.forEach(actor => {
            prompt += `{
                    "Name": "${actor.name}",
                    "Class": "${actor.class}",
                    "HP": "${actor.hp}"
                },`
        });
        prompt +=
            `],
            "Enemies": [`
        enemyActors.forEach(actor => {
            prompt += `{
                    "Name": "${actor.name}",
                    "Class": "${actor.class}",
                    "HP": "${actor.hp}"
                },`
        });
        prompt +=
            `],
            "Summary": ${history},
            "Result": {
                "CombatResult": "Enemy Victory",
                "CombatOutro": "Unknown"
            }
        }`;

        return prompt;
    };

    //The 'user' prompt sent to chatGPT to describe player actions.
    playerTurnPrompt(actor, action, target) {
        let prompt = `{
            "Player": {
                "Name": "${actor.name}",
                "Class": "${actor.class}",
                "Action": "${action.desc}",
                "AttackRoll": "${action.roll}",
                "Target": "${target.name}",
                "Damage": "${action.damage}"
            },
            "Target": {
                "Name": "${target.name}",
                "HP": "${target.hp}",
                "AC": "${target.ac}"
            },
            "Result": {
                "ActionDescription": "Unknown",
                "DamageDealt": "Unknown",
                "RemainingHP": "Unknown"
            }
        }`

        return prompt;
    }

    //The 'user' prompt sent to chatGPT to control enemy actions.
    enemyTurnPrompt(actor, targets) {
        let prompt = `{
            "Enemy": {
                "Name": "${actor.name}"
            },
            "ValidTargets": [`;
            targets.forEach(target => {
                prompt += 
                `{
                "Name": "${target.name}",
                "HP": "${target.hp}",
                "AC": "${target.ac}"
                },`
            });
            prompt +=
            `],
            "Result": {
                "SelectedTarget": "Unknown",
                "ActionDescription": "Unknown",
                "DamageDealt": "Unknown",
                "RemainingHP": "Unknown"
            }
        }`

        return prompt;
    }

//Maybe assign a description to actions, and use that instead?
assignAction(action, atkRoll, damage) {
    return {
        desc: `uses their ${action.name}`,
        roll: atkRoll,
        damage: damage
    };
}

// Generates a basic prompt for the player action. This is mainly just used for determining what dice need to be rolled.
generateBasicActionPrompt(actor, action, target)
{
    return `${actor} uses their ${action.name} on ${target}`;
}

// Generates a prompt for the player action. This is the main action a player takes, that will be described by chatGPT.
generateActionPrompt(actor, action, target, atkRoll, damage) {
    return `${actor} uses their ${action.name} on ${target.name}. If ${atkRoll} is greater than ${target.ac}, deal ${damage} damage.`;
}
}

module.exports = CombatPrompts;