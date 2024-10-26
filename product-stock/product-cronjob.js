import dotenv from 'dotenv';
import cron from 'node-cron';
import { findOutOfStockProducts, updateProductAvailability } from './services/product-service';
import { LogSnag } from '@logsnag/node';
import { connectProducer, sendMessage } from "./queue/kafka-producer"
import { getConfig } from "./utils/config-yml"

dotenv.config();

connectProducer()

const logsnag = new LogSnag({
  token: process.env.LOGSNAG_API_KEY || "65ebe711c44d07fcd34fee9eb9238260",
  project: process.env.LOGSNAG_PROJECT_NAME || "thecollege-store"
});

async function checkAndNotifyOutOfStock(email) {
    try {
        const outOfStockProducts = await findOutOfStockProducts();

        if (outOfStockProducts.length > 0) {
            const productsHtml = `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
                    <h2 style="color: #c0392b; text-align: center;">
                        🚨 Out of Stock Products Alert 🚨
                    </h2>
                    <p style="text-align: center;">The following products are currently out of stock:</p>
                    <div style="margin-top: 20px;">
                        ${outOfStockProducts.map(
                            (product) => `
                                <div style="margin-bottom: 15px; padding: 15px; border: 1px solid #e74c3c; border-radius: 5px; background-color: #fff;">
                                    <h3 style="color: #2c3e50;">ID: ${product.id}</h3>
                                    <p style="font-weight: bold;">Name: ${product.name}</p>
                                    <p style="color: #e74c3c;">Available: ${product.available ? 'Yes' : 'No'}</p>
                                    <p style="color: #e67e22;">⚠️ Stock Level: ${product.stock}</p>
                                </div>
                            `
                        ).join('')}
                    </div>
                </div>
            `;

            await updateProductAvailability(outOfStockProducts);

            await logsnag.track({
              channel: 'product-inventory',
              event: 'Out of Stock Notification',
              description: `Check email sent for more details. Email registered: ${email}`,
              user_id: 'system',
              icon: '🚨',
              notify: true,
              tags: {
                product_count: outOfStockProducts.length.toString(),
              }
            });

            await logsnag.insight.track({
              title: 'Out of Stock Products Count',
              value: outOfStockProducts.length.toString(),
              icon: '📦',
            });

            const stockMessage = {
                title: `Out-of-stock products updated and notification sent.`,
                subject: `Products Out Of Stock`,
                content: productsHtml,
                username: "The College Store System",
                emailTo: email
            };

            await sendMessage('send-notification', stockMessage);

            console.log(stockMessage.title);
        } else {
            console.log('No out-of-stock products found.');
        }
    } catch (error) {
        console.error('Error occurred while checking out-of-stock products:', error);
    
        await logsnag.track({
          channel: 'error',
          event: 'Error in Out of Stock Check',
          description: `An error occurred: ${error.message}`,
          user_id: 'system',
          icon: '⚠️',
          notify: true,
        });
      }
}

// Use the cron schedule and email from the YAML file
async function startCronJob() {
    const config = getConfig();
    if (config) {
        const { cronSchedule, email } = config;
        console.log(`Cron job scheduled with expression: ${cronSchedule}`);

        // Log an event to LogSnag indicating the cron job is active
        await logsnag.track({
            channel: 'cron-jobs',
            event: 'Cron Job Active - Product Stock',
            description: `The cron job for checking out-of-stock products is active with the schedule: ${cronSchedule}`,
            user_id: 'system',
            icon: '🕒',
            notify: true,
        });

        cron.schedule(cronSchedule, () => checkAndNotifyOutOfStock(email));

    } else {
        console.error('Failed to schedule cron job due to missing schedule configuration.');
    }
}

startCronJob();