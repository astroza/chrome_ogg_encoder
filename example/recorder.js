var worker = new Worker('ogg_encoder_worker.js');

(function(window){

	var Recorder = function(source, cfg){
		this.context = source.context;
		this.node = this.context.createScriptProcessor(4096, 2, 2);
		worker.postMessage({
			cmd: 'init',
			sampleRate: this.context.sampleRate
		});
		var recording = false;

		this.node.onaudioprocess = function(e){
			if (!recording) return;
			worker.postMessage({
				cmd: 'write',
				leftData: e.inputBuffer.getChannelData(0),
				rightData: e.inputBuffer.getChannelData(1),
				samplesCount: e.inputBuffer.getChannelData(0).length
			});
		}

		this.record = function(){
			recording = true;
		}

		this.stop = function(){
			recording = false;
			worker.postMessage({cmd: 'finish'});
		}

		worker.onmessage = function(e){
			window.blob = new Blob([new Uint8Array(e.data.buffer, 0, e.data.outputLength)], { type: 'audio/ogg' });
			document.getElementById('audioOgg').href = window.URL.createObjectURL(window.blob);
			document.getElementById('audioOgg').download = "audio.ogg";
		}

		source.connect(this.node);
		this.node.connect(this.context.destination);
	};

	window.Recorder = Recorder;

})(window);
