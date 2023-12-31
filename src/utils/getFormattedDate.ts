import moment from 'moment-timezone'

export function getFormattedDate() {
    const timezone = 'America/New_York'

    const currentDate = moment.tz(timezone).startOf('day')

    const formattedDate = currentDate.format('YYYY-MM-DDTHH:mm:ssZ')

    return formattedDate
}
