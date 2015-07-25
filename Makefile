all:
	./compile_libs.sh
	emcc -O2 -s ASM_JS=1 -s EXPORTED_FUNCTIONS='["_ogg_encoder_init", "_ogg_encoder_write", "_ogg_encoder_finish"]' -Ibuild/include build/lib/libogg.so build/lib/libvorbis.so build/lib/libvorbisenc.so --js-library ./ogg_encoder_js_lib.js ogg_encoder.c -o ogg_encoder.js

clean:
	rm -f ogg_encoder.js ogg_encoder.js.mem
	rm -fr build
