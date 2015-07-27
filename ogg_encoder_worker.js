/* (c) 2015 Felipe Astroza A.
* Under BSD License
*/
importScripts('ogg_encoder.js');

self.do_write_data = function(bufferPtr, bufferLength) {
	if(self.outputBufferSize - self.outputLength < bufferLength) {
		self.outputBufferSize += 4096;
		var newOutputBuffer = new Uint8Array(self.outputBufferSize);
		newOutputBuffer.set(self.outputBuffer, 0, self.outputLength);
		self.outputBuffer = newOutputBuffer;
	}
	emMem = new Uint8Array(Module.HEAPU8.buffer, bufferPtr, bufferLength);
	self.outputBuffer.set(emMem, self.outputLength, bufferLength);
	self.outputLength += bufferLength;
}

self.addEventListener('message', function(e) {
	var params = e.data;
	switch(params.cmd) {
	case 'init':
		self.outputBufferSize = 4096; // 4 kb
		self.outputLength = 0;
		self.outputBuffer = new Uint8Array(self.outputBufferSize);
		self.encoder = _ogg_encoder_init(params.sampleRate, 0.4);
		break;
	case 'write':
		// Copy buffers to Emscripten HEAP
		var emBufferSize = [];
		emBufferSize[0] = params.leftData.length * params.leftData.BYTES_PER_ELEMENT;
		emBufferSize[1] = params.rightData.length * params.rightData.BYTES_PER_ELEMENT;
		
		var emBufferPtr = [];
		emBufferPtr[0] = Module._malloc(emBufferSize[0]);
		emBufferPtr[1] = Module._malloc(emBufferSize[1]);
		
		var emHeap = [];
		emHeap[0] = new Uint8Array(Module.HEAPU8.buffer, emBufferPtr[0], emBufferSize[0]);
		emHeap[1] = new Uint8Array(Module.HEAPU8.buffer, emBufferPtr[1], emBufferSize[1]);
		
		emHeap[0].set(new Uint8Array(params.leftData.buffer));
		emHeap[1].set(new Uint8Array(params.rightData.buffer));

		// Encode PCM data
		_ogg_encoder_write(self.encoder, emBufferPtr[0], emBufferPtr[1], params.samplesCount);
		Module._free(emBufferPtr[0]);
		Module._free(emBufferPtr[1]);
		break;
	case 'finish':
		_ogg_encoder_finish(self.encoder);
		self.postMessage({buffer: self.outputBuffer.buffer, outputLength: self.outputLength}, [self.outputBuffer.buffer]);
		break;
	}
}, false);
