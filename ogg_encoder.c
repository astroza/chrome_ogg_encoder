/* (c) 2015 Felipe Astroza A.
* Under BSD License
*/
#include <stdio.h>
#include <time.h>
#include <stdlib.h>
#include <string.h>
#include <vorbis/vorbisenc.h>

struct ogg_encoder {
	ogg_stream_state os;
	vorbis_info vi;
	vorbis_comment vc;
	vorbis_dsp_state vd;
	vorbis_block vb;
	ogg_packet op;
};

/* write_data is implemented in JavaScript */
extern void write_data(unsigned char *buffer, unsigned int buffer_size);

struct ogg_encoder *ogg_encoder_init(int sample_rate, float vbr_quality)
{
	struct ogg_encoder *encoder = (struct ogg_encoder *)malloc(sizeof(struct ogg_encoder));
	ogg_packet header;
	ogg_packet header_comm;
	ogg_packet header_code;
	ogg_page og;
		
	vorbis_info_init(&encoder->vi);
	if(vorbis_encode_init_vbr(&encoder->vi, 2, sample_rate, vbr_quality)) {
		free(encoder);
		return NULL;
	}
	
	vorbis_comment_init(&encoder->vc);
	vorbis_comment_add_tag(&encoder->vc, "OggEncoderJS", "Ogg vorbis encoder");
	
	vorbis_analysis_init(&encoder->vd, &encoder->vi);
	vorbis_block_init(&encoder->vd, &encoder->vb);
	
	srand(time(NULL));
	ogg_stream_init(&encoder->os, rand());
	
	vorbis_analysis_headerout(&encoder->vd, &encoder->vc, &header, &header_comm, &header_code);
	ogg_stream_packetin(&encoder->os, &header);
	ogg_stream_packetin(&encoder->os, &header_comm);
	ogg_stream_packetin(&encoder->os, &header_code);
	
	while(ogg_stream_flush(&encoder->os, &og)) {
		write_data(og.header, og.header_len);
		write_data(og.body, og.body_len);
	}
	
	return encoder;
}

static void _ogg_encoder_write(struct ogg_encoder *encoder, int samples_count)
{
	int finish = samples_count == 0? 1 : 0;
	vorbis_analysis_wrote(&encoder->vd, samples_count);

	ogg_page og;

	while(vorbis_analysis_blockout(&encoder->vd, &encoder->vb) == 1)
	{
		vorbis_analysis(&encoder->vb, NULL);
		vorbis_bitrate_addblock(&encoder->vb);
		while(vorbis_bitrate_flushpacket(&encoder->vd, &encoder->op))
		{
			ogg_stream_packetin(&encoder->os, &encoder->op);
			while((!finish && ogg_stream_pageout(&encoder->os, &og)) || ( (finish || encoder->op.e_o_s) && ogg_stream_flush(&encoder->os, &og)))
			{
				write_data(og.header, og.header_len);
				write_data(og.body, og.body_len);
			}
		}
	}
}

void ogg_encoder_write(struct ogg_encoder *encoder, float *buffer_left, float *buffer_right, int samples_count)
{
	float **buffer = vorbis_analysis_buffer(&encoder->vd, samples_count);
	int i;

	for(i = 0; i < samples_count; i++) {
		buffer[0][i] = buffer_left[i];
		buffer[1][i] = buffer_right[i];
	}
	_ogg_encoder_write(encoder, samples_count);
}


void ogg_encoder_finish(struct ogg_encoder *encoder)
{
	_ogg_encoder_write(encoder, 0);
	ogg_stream_clear(&encoder->os);
	vorbis_block_clear(&encoder->vb);
	vorbis_dsp_clear(&encoder->vd);
	vorbis_comment_clear(&encoder->vc);
	vorbis_info_clear(&encoder->vi);
}
