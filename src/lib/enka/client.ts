import { z } from 'zod';
import { EnkaResponseSchema, UIDSchema, EnkaError, EnkaErrorCodes } from './types';
import { parseEnkaResponse } from './parser';

const ENKA_BASE_URL = 'https://enka.network/api/uid';

export class EnkaClient {
  private userAgent: string;

  constructor(userAgent?: string) {
    this.userAgent = userAgent || process.env.ENKA_USER_AGENT || 'GenshinLeaderboard/1.0';
  }

  async fetchPlayerData(uid: string) {
    // Validate UID
    const validatedUid = UIDSchema.parse(uid);

    const url = `${ENKA_BASE_URL}/${validatedUid}/`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw await this.handleErrorResponse(response);
      }

      const rawData = await response.json();

      // Validate response structure
      const validated = EnkaResponseSchema.parse(rawData);

      // Parse into clean domain types
      return parseEnkaResponse(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid Enka API response: ${error.message}`);
      }
      throw error;
    }
  }

  private async handleErrorResponse(response: Response): Promise<EnkaError> {
    const status = response.status;
    let message: string;

    switch (status) {
      case EnkaErrorCodes.INVALID_UID:
        message = 'Invalid UID format. Please check the UID and try again.';
        break;
      case EnkaErrorCodes.PLAYER_NOT_FOUND:
        message = 'Player not found. Make sure the UID is correct and the player has their showcase enabled in-game.';
        break;
      case EnkaErrorCodes.GAME_MAINTENANCE:
        message = 'Genshin Impact is under maintenance or the API is updating. Please try again later.';
        break;
      case EnkaErrorCodes.RATE_LIMITED:
        message = 'Rate limit exceeded. Please wait a moment and try again.';
        break;
      case EnkaErrorCodes.SERVER_ERROR:
        message = 'Enka.Network server error. Please try again later.';
        break;
      case EnkaErrorCodes.SERVICE_UNAVAILABLE:
        message = 'Enka.Network service is temporarily unavailable. Please try again later.';
        break;
      default:
        message = `Unexpected error: ${response.statusText}`;
    }

    return {
      code: status,
      message,
    };
  }
}

export const enkaClient = new EnkaClient();
