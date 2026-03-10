import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

const HUB_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5035'}/hubs/game`;

let connection: HubConnection | null = null;

export async function getHubConnection(): Promise<HubConnection> {
  if (connection && connection.state === 'Connected') {
    return connection;
  }

  connection = new HubConnectionBuilder()
    .withUrl(HUB_URL)
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();

  await connection.start();
  return connection;
}
