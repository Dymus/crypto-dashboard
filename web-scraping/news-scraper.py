from pymongo import MongoClient
import praw
import datetime, time
from bs4 import BeautifulSoup
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
news = our_database['news']
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

        for sub in subreddits:
            subreddit = reddit.subreddit(sub)
            for submission in subreddit.search(cryptocurrency, sort = "top", limit = 3, time_filter="week"):
                urls[f'{subreddit}'].append(submission.url)
                titles[f'{subreddit}'].append(submission.title)
 
        # Getting a timestamp
        now = datetime.datetime.now()
        timestamp = now.strftime("%Y-%m-%d %H:%M:%S")
 
        #Saving to database
        for sub in subreddits:
            for i in range(len(urls[sub])):
                soup = BeautifulSoup(requests.get(urls[sub][i]).content,'html.parser')
                image = soup.find('meta',property='og:image')
                image_url = image['content'] if image else 'https://www.mcleodgaming.com/wp-content/uploads/2019/05/reddit_logo-150x150.png'
                news.insert_one({'cryptocurrency': cryptocurrency, 'scraped_at': now, 'image' : image_url, 'top': i+1, 'subreddit': sub, 'url': urls[sub][i], 'title': titles[sub][i]})

    #Wait for 30 minutes            
    time.sleep(1800)