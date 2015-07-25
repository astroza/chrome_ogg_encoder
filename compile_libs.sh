#!/bin/bash

which emcc
if [ $? == 1 ]; then
	echo "Please install emscripten SDK"
	exit 1
fi

rm -fr build
mkdir -p build
cd build
wget http://downloads.xiph.org/releases/ogg/libogg-1.3.2.tar.gz
wget http://downloads.xiph.org/releases/vorbis/libvorbis-1.3.5.tar.gz
tar zxf libogg-1.3.2.tar.gz
tar zxf libvorbis-1.3.5.tar.gz
cd libogg-1.3.2
emconfigure ./configure --prefix=$(pwd)/../../build
find . -name Makefile -type f -exec sed -i 's/-O20/-O2/g' {} +
emmake make
emmake make install
cd ..

cd libvorbis-1.3.5
find . -name Makefile -type f -exec sed -i 's/-O20/-O2/g' {} +
emconfigure ./configure --prefix=$(pwd)/../../build --disable-oggtest
emmake make
emmake make install
cd ..
