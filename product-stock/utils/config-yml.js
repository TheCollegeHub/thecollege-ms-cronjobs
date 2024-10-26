import fs from 'fs';
import yaml from 'js-yaml';

export const getConfig = () => {
    try {
        const fileContents = fs.readFileSync('config.yml', 'utf8');
        const data = yaml.load(fileContents);
        return {
            cronSchedule: data.schedule.cron,
            email: data.notification.email
        };
    } catch (error) {
        console.error('Error reading YAML file:', error);
        return null;
    }
};