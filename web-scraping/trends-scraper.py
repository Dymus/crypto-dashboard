from pymongo import MongoClient
import praw
import datetime, time
import requests
import json

print("Started running the script")

# Acessing the Reddit API
reddit = praw.Reddit(client_id="fEa4it1xgroveg",#my client id
                     client_secret="UMVpzgGog9y7MnbE7CRHmKjAbbHDzA",  #your client secret
                     user_agent="CryptoDashboard", #user agent name
                     username = "UCNCryptoDashboard",     # your reddit username
                     password = "UCNcryptoDASHBOARDsuperSECUREstring")     # your reddit password
# MongoDB client initialization
client = MongoClient('mongodb+srv://sa:CryptoDashboard@cryptodashboard.0obwg.mongodb.net/CryptoDashboard')
our_database = client['CryptoDashboard']
trends = our_database['trends']
cryptocurrencies = ['Bitcoin', 'Ethereum', 'Cardano']
 
# Specifying subreddits to scrape
subreddits = ['CryptoCurrency', 'CryptoCurrencies', 'CryptoCurrencyTrading']  # make a list of subreddits you want to scrape the data from
'''
response = requests.get('https://api.coingecko.com/api/v3/coins/markets?vs_currency=eur&order=market_cap_desc&per_page=200&page=1&sparkline=false').text
response_info = json.loads(response)
 
for coin in response_info:
    cryptocurrencies.append(coin['name'])
'''
while True:
    urls = {}
    titles = {}
    our_database.news.drop()
    
    for cryptocurrency in cryptocurrencies:
        for sub in subreddits:
            urls[sub] = []
            titles[sub] = []

        count = 0
        for sub in subreddits:
            subreddit = reddit.subreddit(sub)
            for submission in subreddit.search(cryptocurrency, sort = "top", limit = None, time_filter="day"):
                count += 1
                urls[f'{subreddit}'].append(submission.url)
                titles[f'{subreddit}'].append(submission.title)
 
        # Getting a timestamp
        now = datetime.datetime.now()
        timestamp = now.strftime("%Y-%m-%d %H:%M:%S")
 
        # Write to MongoDB
        trends.insert_one({'cryptocurrency': cryptocurrency, 'scraped_at': now, 'count': count})
    time.sleep(900)