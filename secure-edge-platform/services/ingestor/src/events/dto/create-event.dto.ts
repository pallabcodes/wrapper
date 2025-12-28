export class CreateEventDto {
  source_id: string;
  source_type: string;
  event_type: string;
  timestamp: string;
  payload: Record<string, any>;
}
