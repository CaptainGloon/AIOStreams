import { Addon, Option, UserData, Stream, ParsedStream } from '../db/index.js';
import { baseOptions, Preset } from './preset.js';
import { Env, constants, ServiceId } from '../utils/index.js';
import { StreamParser } from '../parser/index.js';

class BaguettioStreamParser extends StreamParser {
  protected override getIndexer(
    stream: Stream,
    currentParsedStream: ParsedStream
  ): string | undefined {
    const textToSearch = stream.description || '';

    const trackerRegex = /\b(YGG|C411|Torr9|G3MINI|G-Free|La-Cale|TOS)\b/i;
    const match = textToSearch.match(trackerRegex);

    if (match) {
      return match[1];
    }

    return undefined;
  }
}

export class BaguettioPreset extends Preset {
  static override getParser(): typeof StreamParser {
    return BaguettioStreamParser;
  }

  static override get METADATA() {
    const supportedServices: ServiceId[] = [
      constants.ALLDEBRID_SERVICE,
      constants.TORBOX_SERVICE,
      constants.PREMIUMIZE_SERVICE,
    ];

    const supportedResources = [constants.STREAM_RESOURCE];

    const options: Option[] = [
      ...baseOptions(
        'Baguettio',
        supportedResources,
        Env.DEFAULT_BAGUETTIO_TIMEOUT,
      ),
      {
        id: 'userId',
        name: 'User ID',
        description: 'Your Baguettio identifier',
        type: 'string',
        required: true,
      },
      {
        id: 'trYgg',
        name: 'Enable YGG',
        description: 'Use results from the YGG tracker',
        type: 'boolean',
        default: true,
      },
      {
        id: 'trC411ApiKey',
        name: 'C411 API Key',
        description: 'API Key for the C411 tracker (Optional)',
        type: 'string',
        required: false,
      },
      {
        id: 'c411MagnetOnly',
        name: 'C411 - Magnet Only',
        description: 'Retrieve only magnets for C411',
        type: 'boolean',
        default: true,
      },
      {
        id: 'trTorr9Passkey',
        name: 'Torr9 Passkey',
        description: 'Passkey for the Torr9 tracker (Optional)',
        type: 'string',
        required: false,
      },
      {
        id: 'torr9MagnetOnly',
        name: 'Torr9 - Magnet Only',
        description: 'Retrieve only magnets for Torr9',
        type: 'boolean',
        default: true,
      },
      {
        id: 'trGeminiApiKey',
        name: 'G3MINI API Key',
        description: 'API Key for G3MINI TR4CK3R (Optional)',
        type: 'string',
        required: false,
      },
      {
        id: 'geminiMagnetOnly',
        name: 'G3MINI - Magnet Only',
        description: 'Retrieve only magnets for G3MINI',
        type: 'boolean',
        default: true,
      },
      {
        id: 'trGFreeApiKey',
        name: 'Generation-Free API Key',
        description: 'API Key for Generation-Free (Optional)',
        type: 'string',
        required: false,
      },
      {
        id: 'gFreeMagnetOnly',
        name: 'Generation-Free - Magnet Only',
        description: 'Retrieve only magnets for Generation-Free',
        type: 'boolean',
        default: true,
      },
      {
        id: 'trLaCaleApiKey',
        name: 'LaCale API Key',
        description: 'API Key for LaCale (Optional)',
        type: 'string',
        required: false,
      },
      {
        id: 'laCaleMagnetOnly',
        name: 'LaCale - Magnet Only',
        description: 'Retrieve only magnets for LaCale',
        type: 'boolean',
        default: true,
      },
      {
        id: 'trOldSchoolApiKey',
        name: 'TheOldSchool API Key',
        description: 'API Key for TheOldSchool (Optional)',
        type: 'string',
        required: false,
      },
      {
        id: 'oldSchoolMagnetOnly',
        name: 'TheOldSchool - Magnet Only',
        description: 'Retrieve only magnets for TheOldSchool',
        type: 'boolean',
        default: true,
      }
    ];

    return {
      ID: 'baguettio',
      NAME: 'Baguettio',
      LOGO: 'https://baguettio.org/resources/logo',
      URL: Env.DEFAULT_BAGUETTIO_URL,
      TIMEOUT: Env.DEFAULT_BAGUETTIO_TIMEOUT || Env.DEFAULT_TIMEOUT,
      USER_AGENT: Env.DEFAULT_BAGUETTIO_USER_AGENT || Env.DEFAULT_USER_AGENT,
      SUPPORTED_SERVICES: supportedServices,
      DESCRIPTION: 'French addon for Stremio',
      OPTIONS: options,
      SUPPORTED_STREAM_TYPES: [
        constants.DEBRID_STREAM_TYPE,
      ],
      SUPPORTED_RESOURCES: supportedResources,
    };
  }

  static async generateAddons(
    userData: UserData,
    options: Record<string, any>
  ): Promise<Addon[]> {
    const usableServices = this.getUsableServices(userData, options.services);
    const services = usableServices?.map((s) => s.id) || [];

    return [this.generateAddon(userData, options, services)];
  }

  private static generateAddon(
    userData: UserData,
    options: Record<string, any>,
    services: ServiceId[]
  ): Addon {
    return {
      name: options.name || this.METADATA.NAME,
      displayIdentifier: services.length
        ? services.map(s => constants.SERVICE_DETAILS[s].shortName).join(' | ')
        : 'Baguettio',
      identifier: 'baguettio',
      manifestUrl: this.generateManifestUrl(userData, options, services),
      enabled: true,
      resources: options.resources || this.METADATA.SUPPORTED_RESOURCES,
      timeout: options.timeout || this.METADATA.TIMEOUT,
      preset: {
        id: '',
        type: this.METADATA.ID,
        options: options,
      },
      headers: {
        'User-Agent': this.METADATA.USER_AGENT,
      },
    };
  }

  private static generateManifestUrl(
    userData: UserData,
    options: Record<string, any>,
    services: ServiceId[]
  ) {
    let url = options.url || this.METADATA.URL;
    if (url.endsWith('/manifest.json')) {
      return url;
    }
    url = url.replace(/\/$/, '');

    let alldebridKey = '';
    let torboxKey = '';
    let premiumizeKey = '';

    if (services.includes(constants.ALLDEBRID_SERVICE)) {
      alldebridKey = this.getServiceCredential(constants.ALLDEBRID_SERVICE, userData) as string;
    }
    if (services.includes(constants.TORBOX_SERVICE)) {
      torboxKey = this.getServiceCredential(constants.TORBOX_SERVICE, userData) as string;
    }
    if (services.includes(constants.PREMIUMIZE_SERVICE)) {
      premiumizeKey = this.getServiceCredential(constants.PREMIUMIZE_SERVICE, userData) as string;
    }

    const tmdbApiKey = options.tmdbApiKey || userData.tmdbApiKey || Env.TMDB_API_KEY || "";

    const config = {
      USER_ID: options.userId,
      ALLDEBRID_KEY: alldebridKey,
      TORBOX_KEY: torboxKey,
      PREMIUMIZE_KEY: premiumizeKey,
      // if tmdbApiKey is empty then we use the shared tmdb apikey
      TMDB_SHARED: !tmdbApiKey,
      TMDB_APIKEY: tmdbApiKey,
      AIO: true,
      CACHE_ONLY: false,
      TRACKERS_STATS: false,
      GLOBAL_CACHE_MAGNET: true,
      TR_YGG: options.trYgg ?? true,
      TR_C411_APIKEY: options.trC411ApiKey || "",
      C411_MAGNET_ONLY: options.c411MagnetOnly ?? true,
      TR_TORR9_PASSKEY: options.trTorr9Passkey || "",
      TORR9_MAGNET_ONLY: options.torr9MagnetOnly ?? true,
      TR_GEMINI_APIKEY: options.trGeminiApiKey || "",
      GEMINI_MAGNET_ONLY: options.geminiMagnetOnly ?? true,
      TR_GFREE_APIKEY: options.trGFreeApiKey || "",
      GFREE_MAGNET_ONLY: options.gFreeMagnetOnly ?? true,
      TR_LACALE_APIKEY: options.trLaCaleApiKey || "",
      LACALE_MAGNET_ONLY: options.laCaleMagnetOnly ?? true,
      TR_OLDSCHOOL_APIKEY: options.trOldSchoolApiKey || "",
      OLDSCHOOL_MAGNET_ONLY: options.oldSchoolMagnetOnly ?? true,
      EXCLUDED_RESOLUTIONS: [],
      EXCLUDED_LANGUAGES: [],
      EXCLUDED_QUALITY: [],
    };

    const configString = this.base64EncodeJSON(config);

    return `${url}/${configString}/manifest.json`;
  }
}