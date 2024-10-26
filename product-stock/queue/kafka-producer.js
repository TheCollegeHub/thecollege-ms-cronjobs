import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'thecollege-app',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();

const connectProducer = async () => {
  await producer.connect();
  console.log('Kafka Producer connected');
};

const sendMessage = async (topic, message) => {
  try {
    await producer.send({
      topic,
      messages: [
        {
          value: JSON.stringify(message),
        },
      ],
    });
    console.log(`Message sent to ${topic}:`, message);
  } catch (error) {
    console.error('Error sending message to Kafka:', error);
  }
};

const disconnectProducer = async () => {
  await producer.disconnect();
  console.log('Kafka producer disconnected');
};

export { connectProducer, sendMessage, disconnectProducer };
