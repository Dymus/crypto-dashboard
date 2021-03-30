from pymongo import MongoClient
import praw
import datetime, time

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
collection = our_database['trends']
news = our_database['news']
cryptocurrencies = []
 
# Specifying subreddits to scrape
subreddits = ['CryptoCurrency', 'CryptoCurrencies', 'CryptoCurrencyTrading']  # make a list of subreddits you want to scrape the data from
 
response = requests.get('https://api.coingecko.com/api/v3/coins/markets?vs_currency=eur&order=market_cap_desc&per_page=200&page=1&sparkline=false').text
response_info = json.loads(response)
 
for coin in response_info:
    cryptocurrencies.append(coin['name'])
# Keywords to look for trends
 
while True:
    urls = {}
    titles = {}
    our_database.news.drop()
    for sub in subreddits:
        urls[sub] = []
        titles[sub] = []
 
    for cryptocurrency in cryptocurrencies:
        count = 0
        for sub in subreddits:
            subreddit = reddit.subreddit(sub)
            for submission in subreddit.search(cryptocurrency, sort = "top", limit = None, time_filter="day"):
                count += 1
                urls[f'{subreddit}'].append([submission.url, submission.score])
                titles[f'{subreddit}'].append([submission.title])
 
        # Getting a timestamp
        now = datetime.datetime.now()
        timestamp = now.strftime("%Y-%m-%d %H:%M:%S")
 
        # Writing to file
        #f = open(f'{cryptocurrency}.txt', 'a')
        #f.write(f'Date: {timestamp} \tTrending {count} times.\n\n')
 
        for sub in subreddits:
            #f.write(f'Here are the links to top trending reddit submissions from {sub}:\n')
            for i in range(3):
                #f.write(f'\t {urls[sub][i][0]} \n')
                news.insert_one({'cryptocurrency': cryptocurrency, 'scraped_at': now, 'top': i+1, 'subreddit': sub, 'url': urls[sub][i][0], 'title': titles[sub][i][0]})
 
        #f.close() 
 
        # Write to MongoDB
        #collection.insert_one({'cryptocurrency': cryptocurrency, 'scraped_at': now, 'count': count})
    time.sleep(900)