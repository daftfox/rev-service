import { ConfigurationService } from '../service/configuration.service';
import { PROCESS_ARGV } from './process-args.mock';

process.argv = PROCESS_ARGV;

export const configurationServiceMock = new ConfigurationService();
