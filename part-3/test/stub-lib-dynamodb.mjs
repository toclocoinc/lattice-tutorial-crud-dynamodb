export const sent = [];
export const responses = [];
const command = (name) => class { constructor(input) { this.name = name; this.input = input; } };
export const ScanCommand = command('Scan');
export const PutCommand = command('Put');
export const UpdateCommand = command('Update');
export const DeleteCommand = command('Delete');
export const DynamoDBDocumentClient = {
  from: () => ({ send: async (cmd) => { sent.push(cmd); return responses.shift() ?? {}; } }),
};
