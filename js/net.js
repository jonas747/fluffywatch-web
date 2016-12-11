/**
 * Networking module that handles webscket connections and message receiving/sending
 * @module Net
 * @main Net
 */
var Net = Net || {};
/**
 * The engine itself
 * @class Net.Engine
 * @constructor
 * @param {String} address - The address of the server
 */
Net.Engine = function(address){
	/**
	 * Address of the server
	 * @property address
	 * @type String
	*/
	this.address = address

	/**
	 * Indicates wether the engine is running or not
	 * @attribute running
	 * @type Boolean
	 */
	this.running = false;

	/**
	 * The built protocol buffer messages
	 * @attribute messages
	 * @type Object
	 */
	this.messages = {};

	/**
	 * The websocket object
	 * @attribute websocket
	 * @type WebSocket
	*/
	this.websocket;

	/**
	 * A array containing all the handlers, The index is the event id of the handler
	 * @attribute handlers
	 * @type Array
	 */
	this.handlers = [];

	/**
	 * Indicates if we are connected or not
	 * @attribute isConnected
	 * @type Boolean
	 */
	this.isConnected = false;

	 /**
	  * An array of messages to be sent when the connection is ready
	  *	@attribute messageQueue
	  * @type Array
	  * @private
	  */
	this._messageQueue = [];
}

/**
 * Handles the messages fom the websocket connection
 * @method _onWsMessage
 * @private
 * @param {MessageEvent} data - the websocket message.
 */
Net.Engine.prototype._onWsMessage = function(buf){

	// Create a dataview to get the event id
	var view = new DataView(buf.data);
	var evtId = view.getInt32(0, true);
	var plLength = view.getInt32(4, true);

	// Create a new arraybuffer without the event id
	var restBuf = buf.data.slice(8);

	var parsed = {};
	var handler = this.handlers[evtId];

	if (plLength > 0) {
		// Decode the message if any
		var u8Arr = new Uint8Array(restBuf)
		var string = new TextDecoder("utf-8").decode(u8Arr)
		parsed = JSON.parse(string)
	};

	// Call the callback
	if(this.handlers[evtId]){
		handler.callback(parsed);
	}else{
		console.log("Handler not found for evt " + evtId + "; Data: ", new Uint8Array(restBuf), parsed);
	}
}

/**
 * Called when the websocket connection is opened
 * @method _onWsOpen
 * @private
 */
Net.Engine.prototype._onWsOpen = function(){
	console.log("Connection opened");
	this.isConnected = true;

	// Send all the messages in the queue
	console.log("Processing " + this._messageQueue.length + " In message qeue")
	for (var i = 0; i < this._messageQueue.length; i++) {
		this.websocket.send(this._messageQueue[i]);
	};
	this._messageQueue = [];
	$("#notconnected").addClass("hidden");
	if(this.onOpen){
		this.onOpen();
	}
}

/**
 * Called when the websocket connection is closed
 * @method _onWsClose
 * @private
 */
Net.Engine.prototype._onWsClose = function(){
	console.log("Connection closed")
	this.isConnected = false;
	$("#notconnected").removeClass("hidden");

	if(this.onClose){
		this.onClose();
	}
}

/**
 * Called on errors in the websocket connection
 * @method _onWsError
 * @private 
 * @param {Error} error - The error
 */
Net.Engine.prototype._onWsError = function(error){
	console.log(error)
}

/**
 * Send message of type Net.Message to the websocket connection
 * @method sendMessage
 * @param {Numer} eventId - The event id
 * @param {Object} message - Sends message to the server
 */
Net.Engine.prototype.sendMessage = function(evtId, message){

	var serialized = this.serializeMessage(evtId, message);
	 //Check if we are connected, if not queue it up to be sent when connected
	if(!this.isConnected){
		console.log("Not connected, queueing up message instead...") 
		this._messageQueue.push(serialized);
		return
	}
	this.websocket.send(serialized) 
}

/**
 * Starts the engine and connects 
 * @method run
 */
Net.Engine.prototype.run = function(){
	// Connect to the server
	this.websocket = new WebSocket(this.address);
	this.websocket.binaryType = "arraybuffer";

	// Assign the event listeners
	this.websocket.onopen 	 = this._onWsOpen.bind(this);
	this.websocket.onclose 	 = this._onWsClose.bind(this);
	this.websocket.onmessage = this._onWsMessage.bind(this);
	this.websocket.onerror 	 = this._onWsError.bind(this);
}

/**
 * Adds a handler for a specific event id
 * @method addHandler
 * @param {Net.Handler} handler - The handler
 */

Net.Engine.prototype.addHandler = function(handler){
	this.handlers[handler.eventId] = handler;
}

/**
 * Serializes a message to the server, using json and adding the tiny header
 * @method serializeMessage
 * @param {Number} evtId - The event id
 * @param {Object} message - the message itself being a javascript object
 */
Net.Engine.prototype.serializeMessage = function(evtId, msg){
	// Encode the object
	//var encoded = this.msgObj.encode();
	var encodedAb = new ArrayBuffer(0);
	var encodedView
	if(msg){
		var jsonStr = JSON.stringify(msg)
		var uint8array = new TextEncoder("utf-8").encode(jsonStr);
		encodedAb = uint8array.buffer
		encodedView = new Uint8Array(encodedAb);
	}



	// Create a new arraybuffer, which will hold everything
	var buffer = new ArrayBuffer(encodedAb.byteLength+8);
	
	// Create a dataview to put the event id in the arraybuffer
	var dataView = new DataView(buffer);
	dataView.setInt32(0, evtId, true);
	if (msg) {
		dataView.setInt32(4, encodedAb.byteLength, true);
	}else{
		dataView.setInt32(4, 0, true);		
	}

	// Add the json content
	var U8View = new Uint8Array(buffer);
	if (msg) {
		U8View.set(encodedView, 8);
	}
	
	// Return the resulting ArrayBuffer
	return U8View.buffer
}

/**
 * Class refering to a network event handler
 * @constructor
 * @class Net.Handler
 * @param {Number} eventId - The eventid the callback is called on
 * @param {Function} callback - The callback itself
 */
Net.Handler = function(eventId, callback){

	/**
	 * The event Id the callback is called on
	 * @property eventId
	 * @type Number
	 */
	this.eventId = eventId;

	/**
	 * The callback
	 * @property callback
	 * @type Function
	 */
	this.callback = callback;

}