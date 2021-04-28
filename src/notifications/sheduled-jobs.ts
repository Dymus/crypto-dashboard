import axios from "axios";
import { scheduleJob } from "node-schedule";
import { v4 as uuid4 } from "uuid";
import { UserModel } from "../models/user-model";
import { Server as HttpServer } from "http";
import { Notifier } from "./notifier";
import { ObjectID } from "mongodb"

let tries = 0;
let success = 0;

const notifier = new Notifier();

export const createAndScheduleNotifier = (server: HttpServer) => {
  notifier.connect(server)
    
  scheduleJob('* */15 * * * *', () => {
    updateHourlyNotifications();
  })
  
  scheduleJob('* * */6 * * *', () => {
    updateDailyNotifications();
  })
  
  scheduleJob('* * * */1 * *', () => {
    updateWeeklyNotifications()
  })
}

const setUserHourlyNotifications = (user, coingeckoData) => {
  const newNotifications = [] as AlertNotification[]
  for (const coingeckoName in user.alerts) {
    const coinData = coingeckoData.find(coin => coin.id === coingeckoName)
    if (Math.abs(coinData.price_change_percentage_1h_in_currency) >= user.alerts[coingeckoName].hourPriceChange && user.alerts[coingeckoName].hourPriceChange !== 0) {
      newNotifications.push(
        {
          id: uuid4(),
          createdAt: Date.now(),
          iconUrl: coinData.image,
          title: coinData.price_change_percentage_1h_in_currency > 0 ? `${coinData.name} is going up` : `${coinData.name} is going down`,
          message: coinData.price_change_percentage_1h_in_currency > 0 ? `Hour price alert: ${coinData.name} went up ${Math.floor(coinData.price_change_percentage_1h_in_currency * 100) / 100}%` : `Hour price alert: ${coinData.name} went down ${Math.floor(coinData.price_change_percentage_1h_in_currency * 100) / 100}%`,
          wasViewed: false,
          type: coinData.price_change_percentage_1h_in_currency > 0 ? "gain" : "loss"
        })
        
    }
  }

  const oldNotifications = user.notifications
  user.notifications = [...oldNotifications, ...newNotifications]
  return UserModel.findById({ _id: new ObjectID(user._id) })
    .then(foundUser => {
      foundUser.notifications = [...oldNotifications, ...newNotifications]
      return foundUser.save()
    })
    .then(() => {
      newNotifications.forEach(notification => {
        notifier.send(user._id, notification)
      })
      return true
    },() => {
      return false
    })
}

const setUserDailyNotifications = (user, coingeckoData) => {
  const newNotifications = [] as AlertNotification[]
  for (const coingeckoName in user.alerts) {
    const coinData = coingeckoData.find(coin => coin.id === coingeckoName)
    if (Math.abs(coinData.price_change_percentage_24h_in_currency) >= user.alerts[coingeckoName].hourPriceChange && user.alerts[coingeckoName].hourPriceChange !== 0) {
      newNotifications.push(
        {
          id: uuid4(),
          createdAt: Date.now(),
          iconUrl: coinData.image,
          title: coinData.price_change_percentage_24h_in_currency > 0 ? `${coinData.name} is going up` : `${coinData.name} is going down`,
          message: coinData.price_change_percentage_24h_in_currency > 0 ? `Day price alert: ${coinData.name} went up ${Math.floor(coinData.price_change_percentage_24h_in_currency * 100) / 100}%` : `Day price alert: ${coinData.name} went down ${Math.floor(coinData.price_change_percentage_24h_in_currency * 100) / 100}%`,
          wasViewed: false,
          type: coinData.price_change_percentage_24h_in_currency > 0 ? "gain" : "loss"
        })
        
    }
  }

  const oldNotifications = user.notifications
  user.notifications = [...oldNotifications, ...newNotifications]
  return UserModel.findById({ _id: new ObjectID(user._id) })
    .then(foundUser => {
      foundUser.notifications = [...oldNotifications, ...newNotifications]
      return foundUser.save()
    })
    .then(() => {
      newNotifications.forEach(notification => {
        notifier.send(user._id, notification)
      })
      return true
    },() => {
      return false
    })
}

const setUserWeeklyNotifications = (user, coingeckoData) => {
    const newNotifications = [] as AlertNotification[]
    for (const coingeckoName in user.alerts) {
      const coinData = coingeckoData.find(coin => coin.id === coingeckoName)
      if (Math.abs(coinData.price_change_percentage_7d_in_currency) >= user.alerts[coingeckoName].hourPriceChange && user.alerts[coingeckoName].hourPriceChange !== 0) {
        newNotifications.push(
          {
            id: uuid4(),
            createdAt: Date.now(),
            iconUrl: coinData.image,
            title: coinData.price_change_percentage_7d_in_currency > 0 ? `${coinData.name} is going up` : `${coinData.name} is going down`,
            message: coinData.price_change_percentage_7d_in_currency > 0 ? `Week price alert: ${coinData.name} went up ${Math.floor(coinData.price_change_percentage_7d_in_currency * 100) / 100}%` : `Week price alert: ${coinData.name} went down ${Math.floor(coinData.price_change_percentage_7d_in_currency * 100) / 100}%`,
            wasViewed: false,
            type: coinData.price_change_percentage_7d_in_currency > 0 ? "gain" : "loss"
          })
          
      }
    }

    const oldNotifications = user.notifications
    user.notifications = [...oldNotifications, ...newNotifications]
  return UserModel.findById({ _id: new ObjectID(user._id) })
    .then(foundUser => {
      foundUser.notifications = [...oldNotifications, ...newNotifications]
      return foundUser.save()
    })
    .then(
      () => {
    newNotifications.forEach(notification => {
      notifier.send(user._id, notification)
    })
    return true;
  },
  () => {
    return false;
  })
}

const updateHourlyNotifications = () => {
  UserModel.find({ alerts: { $nin: [null, new Object()] } }).then(async usersWithAlerts => {
    if (usersWithAlerts.length > 0) {
      const coingeckoData = (await axios.get(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=eur&ids=${usersWithAlerts.map(user => {
        const coingeckoNames = [];
        for (const coingeckoName in user.alerts) {
          coingeckoNames.push(coingeckoName)
        }
        return coingeckoNames
      }).join(",")}&per_page=100&page=1&sparkline=false&price_change_percentage=1h`)).data

      usersWithAlerts.forEach(async user => {
        let wasSuccess = false;
        while (!wasSuccess) {
          tries ++
         wasSuccess = await setUserHourlyNotifications(user, coingeckoData)
        }
        success ++
      })
    }
  })
}

const updateDailyNotifications = () => {
  UserModel.find({ alerts: { $nin: [null, new Object()] } }).then(async usersWithAlerts => {
    if (usersWithAlerts.length > 0) {
      const coingeckoData = (await axios.get(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=eur&ids=${usersWithAlerts.map(user => {
        const coingeckoNames = [];
        for (const coingeckoName in user.alerts) {
          coingeckoNames.push(coingeckoName)
        }
        return coingeckoNames
      }).join(",")}&per_page=100&page=1&sparkline=false&price_change_percentage=24h`)).data

      usersWithAlerts.forEach( async user => {
        let wasSuccess = false
        while (!wasSuccess) {
          tries ++
          wasSuccess = await setUserDailyNotifications(user, coingeckoData)
        }
        success ++
      })
    }
  })
}

const updateWeeklyNotifications = () => {
    // get the data from coingecko
    UserModel.find({ alerts: { $nin: [null, new Object()] } }).then(async usersWithAlerts => {
        if (usersWithAlerts.length > 0) {
          const coingeckoData = (await axios.get(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=eur&ids=${usersWithAlerts.map(user => {
            const coingeckoNames = [];
            for (const coingeckoName in user.alerts) {
              coingeckoNames.push(coingeckoName)
            }
            return coingeckoNames
          }).join(",")}&per_page=100&page=1&sparkline=false&price_change_percentage=7d`)).data
    
          usersWithAlerts.forEach(async user => {
            let wasSuccess = false;
            while (!wasSuccess) {
              tries ++
                wasSuccess = await setUserWeeklyNotifications(user, coingeckoData)
            }
            success ++
          })
        }
      })
}


