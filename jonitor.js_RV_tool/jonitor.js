/**
 * Filename    : jonitor.js
 * Author      : Bernard Mizzi
 * Created     : 2018-03-08
 * Last Changed: 2018-05-22
 *
 * This library injects code in functions (found in window) to perform AOP runtime verification by
 * storing the arguments and return values of the function.
 *
 * The technique is approached by creating a new function that overrides the desired existing function,
 * checking the before condition, calling the original function (by using apply) and then checking
 * the after conditions.
 *
 * The rules are found in properties.prts and are parsed by this library.
*/

//create a namespace to store the jonitor functions
var jonitor = {

    /**
     * List of allowed events
     */
    allowedEvents: "",

    /**
     * 2-d array that will store the rules in the structure: before/after, event, condition and action
     */
    rulesArr: [
        ['b/a', 'event', 'condition', 'action']
    ],

    /**
     * Function that reads a text file (used for the properties)
     *
     * @param file The file path
     */
    readTextFile: function(file) {
        var rawFile = new XMLHttpRequest();
        rawFile.open("GET", file, false);
        rawFile.onreadystatechange = function ()
        {
            if(rawFile.readyState === 4)
            {
                if(rawFile.status === 200 || rawFile.status == 0)
                {
                    var allText = rawFile.responseText;
                    //console.log("Rules: " + allText);

                    //read and parse the rules
                    jonitor.readRules(allText)
                }
            }
        }
        rawFile.send(null);
    },

    /**
     * Function that reads and parses the rules in a 2-d array
     *
     * @param rules The rules stored as a string
     */
    readRules: function(rules){

        var continueReading = false

        var when = ''

        var event = ''

        var condition = ''

        var action = ''

        var tempRule = []

        var startRule = true

        var startWhen = false;

        var startEvent = false

        var startCondition = false

        var startAction = false

        var endRule = false

        for (var i = 0; i < rules.length; i++) {

            //indicate that rule has started
            if (rules.charAt(i) === '/' && startRule) {
                startWhen = true
                startRule = false
                continueReading = true
            }else if(continueReading) {

                if(rules.charAt(i) === '/' && rules.charAt(i+1) === '/' && startWhen){
                    tempRule.push(when)
                    //reset the flag
                    startWhen = false
                    //set that next is event
                    startEvent = true

                    continueReading = true;

                    i++
                }else if(rules.charAt(i) === '/' && rules.charAt(i+1) === '/' && startEvent){
                    //reset the flag
                    startEvent = false
                    //insert in rules 2d array
                    tempRule.push(event)
                    event = ''
                    //set flag to start the condition
                    startCondition = true

                    continueReading = true;
                    i++
                }else if(rules.charAt(i) === '/' && rules.charAt(i+1) === '/' && startCondition){
                    //reset the flag
                    startCondition = false
                    //insert in rules 2d array
                    tempRule.push(condition)
                    condition = ''
                    //set the flag to start action
                    startAction = true

                    continueReading = true;
                    i++
                }else if(rules.charAt(i) === '/' && rules.charAt(i+1) === '/' && startAction){
                    //reset the flag
                    startAction = false
                    //insert in rules 2d array
                    tempRule.push(action)
                    action = ''
                    //set the flag to start action
                    endRule = true

                    continueReading = false;
                    i++
                }
                else {
                    if (startWhen && rules.charAt(i) != ' ') {
                        //before/after
                        when = rules.charAt(i)
                    } else if (startEvent && rules.charAt(i) != ' ') {
                        //add to event
                        event = event + rules.charAt(i)
                    } else if (startCondition) {
                        //add to condition
                        condition = condition + rules.charAt(i)
                    } else if (startAction) [
                        //add to action
                        action = action + rules.charAt(i)
                    ]
                }

            }else if(endRule){
                //reset the flag
                endRule = false
                //duplicate object to have two objects
                var temp = jQuery.extend(true, {}, tempRule);
                jonitor.rulesArr.push(temp)

                tempRule = []
                //set the flag to start rule
                startRule = true

                continueReading = true;
            }
        }

        jonitor.saveRulesLocalStorage();
    },

    /**
     * Function that returns the index of the applied rule
     *
     * @param index from where to start searching
     * @param when whether before or after
     * @param event the name of the event
     * @returns {number} the index of rule if found, -1 otherwise
     */
    retrieveRuleIndex: function(index, when, event){

        for(var i = index; i < jonitor.rulesArr.length; i++){
            if(when === jonitor.rulesArr[i][0] && event === jonitor.rulesArr[i][1]) return i
        }

        return -1
    },

    /**
     * Function that returns the condition of the rule
     *
     * @param index index from where to retrieve condition
     * @returns {string} the condition
     */
    retrieveCondition: function(index){
        return jonitor.rulesArr[index][2]
    },

    /**
     * Function that returns the action of the rule
     *
     * @param index index from where to retrieve action
     * @returns {string} the action
     */
    retrieveAction: function(index){
        return jonitor.rulesArr[index][3]
    },

    /**
     * Function that saves the rules to the local storage
     */
    saveRulesLocalStorage: function(){
        localStorage.rulesjonitor = JSON.stringify(jonitor.rulesArr)
    },

    /**
     * Function that gets the rules from the local storage
     */
    getRulesLocalStorage: function(){
        jonitor.rulesArr = JSON.stringify(localStorage.rulesjonitor)
    },

    /**
     * Array that stores a function trace. Used in another function which checks if
     * function trace was bad.
     */
    functionTrace: [],

    /**
     * Function that prints out the function trace.
     */
    printTrace: function(){
        var log_text;
        for(var i = 0; i < this.functionTrace.length; i++){
            log_text += this.functionTrace[i] + " ";
        }
        console.log(log_text);
    },

    /**
     * Current arguments of current functions
     */
    currentArgs: [],

    /**
     * Where the return value is stored
     */
    returnValue: 0,

    /**
     * Function that performs the before actions and conditions
     *
     * @param func_name the name of the desired function
     */
    before: function(func_name){
        //BEFORE
        //reset the return value
        jonitor.returnValue = 0

        //the text that will be logged on screen
        var log_text = "Called function " + func_name;

        //if function was called with arguments
        if(jonitor.currentArgs.length != 0) {
            log_text += ", Arguments: ";
            for (var i = 0; i < jonitor.currentArgs.length; i++) {//iterate arguments
                //if argument not a function
                if(typeof jonitor.currentArgs[i] !== 'function') {
                    //log the argument
                    log_text += jonitor.currentArgs[i] + " / ";
                }
            }
        }

        //retrieve the index of the rule, if no rules is found the function returns -1
        var ruleIndex = jonitor.retrieveRuleIndex(1, 'b', func_name)
        //whether condition has been evaluated to true or false
        var condition = false
        var found = false

        //while a rule is always found
        while(ruleIndex != -1){

            var conditionFunction = Function(jonitor.retrieveCondition(ruleIndex))

            //evaluate the condition
            if(conditionFunction()){
                //mark that condition has been evaluated to true
                condition = true
                found = false
                break
            }

            //retrieve the index again
            ruleIndex = jonitor.retrieveRuleIndex(ruleIndex+1, 'b', func_name)
        }

        if(condition){
            // console.log("Before Condition evaluated to true")

            var actionFunction = Function(jonitor.retrieveAction(ruleIndex))

            //if condition was true then evaluate the action
            actionFunction()
            //console.log("Before Action of rule " + ruleIndex + " evaluated")
        }


        //log on console
        console.log(log_text)

    },

    /**
     * Function that performs the after conditions and actions
     *
     * @param func_name the name of the desired function
     */
    after: function (func_name) {
        //AFTER
        //retrieve the index of the rule, if no rules is found the function returns -1
        ruleIndex = jonitor.retrieveRuleIndex(1, 'a', func_name)
        //whether condition has been evaluated to true or false
        condition = false
        found = false

        //while a rule is always found
        while(ruleIndex != -1){

            var conditionFunction = Function(jonitor.retrieveCondition(ruleIndex))

            //evaluate the condition
            if(conditionFunction()){
                //mark that condition has been evaluated to true
                condition = true
                found = true
                break
            }

            //retrieve the index again
            ruleIndex = jonitor.retrieveRuleIndex(ruleIndex+1, 'a', func_name)
        }

        if(condition){
            //console.log("After Condition evaluated to true")

            var actionFunction = Function(jonitor.retrieveAction(ruleIndex))

            //if condition was true then evaluate the action
            actionFunction()
            //console.log("After Action of rule " + ruleIndex + " evaluated")
        }

        //reset the arguments array
        jonitor.currentArgs = []

    },

    /**
     * Function that accepts a function and then attaches a log to it
     *
     * @param func The function
     */
    instrument: function(func, name) {

        //store the name of the old function
        var func_name = func.name.toString();
        //rename the old function
        func.name = func_name + "New";


        //new function with the name of original function
        window[func_name] = function(){

            //set the current arguments in arguments array
            jonitor.currentArgs = arguments

            //this is done to seperate the functions in the profiler

			//execute the before conditions and actions
			jonitor.before(func_name);
			
			//calls the original function with the passed arguments
			jonitor.returnValue = func.apply(this, jonitor.currentArgs);
			
			 //execute the after conditions and actions
			jonitor.after(func_name);

            //if there was a return value return it
            if(typeof jonitor.returnValue != 'undefined') return jonitor.returnValue

        };

    },

    /**
     * Function that checks whether event name is part of desired events
     *
     * @param event the name of the event
     * @returns {boolean} true if part of event, false if not
     */
    isEvent: function(event){

        if(jonitor.allowedEvents.includes(event + ",")) {
            return true
        }
        //function was not found in list of events
        return false
    },

    /**
     * Function that iterates over the window object to detect functions.
     * Sends functions for instrumentation to function instrument.
     */
    instrumentFunctions: function(){

        //check the 2d array of rules
        jonitor.checkRulesLocalStorage()

        //check the array of users
        jonitor.checkUsersFromLocalStorage()

        jonitor.getUsersjonitorLocalStorage()

        //read the text file which contains the rules
        jonitor.readTextFile("/javascript/properties.prts")

        console.log("\n\nGoing to instrument functions...\n\n\n")

        for(var decl in window){//for every decleration in the namespace
            //decl is a string
            var decl_iteration = window[decl];
			
            if(typeof decl_iteration === 'function'){//if the declaration is a function
                //pass it for instrumentation
                //console.log("Detected function " + decl)
                this.instrument(decl_iteration, decl);
            }
			
			/*
			//new modification
			if(typeof decl_iteration === 'function' && jonitor.isEvent(decl)){//if the declaration is a function
                //pass it for instrumentation
                //console.log("Detected function " + decl)
                this.instrument(decl_iteration, decl);
            }
			*/
        }


        console.log("\n\nFunctions successfully instrumented.\n\n\n")

    }

};
