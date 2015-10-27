import Fs            from 'original-fs';
import Path          from 'path';
import Crypto        from 'crypto';
import MusicMetadata from 'musicmetadata';
import Util          from '../../common/Util.js';
import FileUtil      from './FileUtil.js';

/**
 * Read the metadata from music file.
 */
export default class MusicMetadataReader {
  /**
   * Initialize instance.
   *
   * @param {String} saveImageDirPath Path of the folder in which to save the image.
   */
  constructor( saveImageDirPath ) {
    /**
     * Path of the folder in which to save the image
     * @type {String}
     */
    this._saveImageDirPath = saveImageDirPath;

    if( this._saveImageDirPath ) {
      FileUtil.mkdir( this._saveImageDirPath, ( err ) => {
        if( err ) {
          if( DEBUG ) { Util.error( err ); }
        }
      } );
    }
  }

  /**
   * Get the save image directory path.
   *
   * @return {String} Directory path.
   */
  get saveImageDirPath() {
    return this._saveImageDirPath;
  }

  /**
   * Set the save image directory path.
   *
   * @param {String} path Directory path.
   */
  set saveImageDirPath( path ) {
    this._saveImageDirPath = path;
  }

  /**
   * Read the metadata from music file.
   *
   * @param {String}   filePath Music file path.
   * @param {Function} callback Callback function.
   */
  read( filePath, callback ) {
    Promise.resolve()
    .then( () => {
      return this._readMetadata( filePath );
    } )
    .then( ( params ) => {
      return this._readImage( params );
    } )
    .then( ( params ) => {
      const m     = params.metadata;
      const music = {
        path:     filePath,
        artist:   ( 0 < m.artist.length ? m.artist[ 0 ] : '' ),
        album:    m.album || '',
        title:    m.title || '',
        year:     m.year || '',
        track:    ( m.track ? m.track.no : 1 ),
        disk:     ( m.disk  ? m.disk.no : 1 ),
        genre:    ( 0 < m.genre.length ? m.genre[ 0 ] : '' ),
        duration: m.duration,
        image:    params.image
      };

      callback( null, music );
    } )
    .catch( ( err ) => {
      callback( err );
    } );
  }

  /**
   * Read the metadata from music file.
   *
   * @param {String} filePath Music file path.
   *
   * @return {Promise} Instance of Promise.
   */
  _readMetadata( filePath ) {
    return new Promise( ( resolve, reject ) => {
      const stream = Fs.createReadStream( filePath );
      MusicMetadata( stream, { duration: true }, ( err, metadata ) => {
        if( err ) {
          return reject( err );
        }

        resolve( { metadata } );
      } );
    } );
  }

  /**
   * Read and save the image from music metadata.
   *
   * @param {Object} metadata Music metadata.
   */
  _readImage( params ) {
    return new Promise( ( resolve ) => {
      const picture = params.metadata.picture;
      if( !( this._saveImageDirPath && picture && 0 < picture.length ) ) {
        return resolve( params );
      }

      const fileName = this._getHash( picture[ 0 ].data ) + '.' + picture[ 0 ].format;
      const filePath = Path.join( this._saveImageDirPath, fileName );

      // Save image file
      FileUtil.writeFile( filePath, picture[ 0 ].data, ( err ) => {
        const newParams = params;
        if( err ) {
          if( DEBUG ) { Util.error( err ); }
        } else {
          newParams.image = filePath;
        }

        resolve( newParams );
      } );
    } );
  }

  /**
   * Get the SHA-1 hash from binary data.
   *
   * @param {ArrayBuffer} data Ninary data.
   *
   * @return {String} Hash string.
   */
  _getHash( data ) {
    const sha = Crypto.createHash('sha1');

    sha.update( data );
    return sha.digest( 'hex' );
  }
}