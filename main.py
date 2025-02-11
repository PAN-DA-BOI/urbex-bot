import discord
from discord.ext import commands
import os

intents = discord.Intents.default()
intents.message_content = True

bot = commands.Bot(command_prefix='/', intents=intents)

# Directory containing kit files
KIT_DIRECTORY = 'kits'

@bot.command(name='announce')
async def announce(ctx, *, args: str):
    # Split the arguments manually
    parts = args.split(", ")
    if len(parts) != 4:
        await ctx.send("Incorrect number of arguments. Usage: /announce 'location', 'location name', 'date time', 'description'")
        return

    location_name = parts[0].strip("'")
    location = parts[1].strip("'")
    date_time = parts[2].strip("'")
    description = parts[3].strip("'")

    embed = discord.Embed(title=f"Announcement for {location_name}", description=description, color=0x00ff00)
    embed.add_field(name="Location", value=location, inline=False)
    embed.add_field(name="Date and Time", value=date_time, inline=False)
    await ctx.send(embed=embed)

@bot.command(name='bot')
async def show_commands(ctx):
    commands_list = """
    **/announce 'location', 'location name', 'date time', 'description'**
    - Announces when and what we're doing for the adventure.
    

    **/bot**
    - Shows all the commands the bot knows, and how to use them.
    

    **/getkit [kit to get]**
    - Gets a kit list from the designated place.
    

    **/proposal [# of locations (example of three locations)] [location1] [location2] [location3]**
    - Makes a poll to choose where we should go.
    """
    await ctx.send(commands_list)

@bot.command(name='getkit')
async def get_kit(ctx, *, kit_name: str):
    kit_path = os.path.join(KIT_DIRECTORY, f"{kit_name}.qit")
    print(f"Current working directory: {os.getcwd()}")
    print(f"Looking for kit file at: {kit_path}")
    if os.path.exists(kit_path):
        with open(kit_path, 'r') as file:
            kit_contents = file.read()
        await ctx.send(f"Contents of {kit_name} kit:\n{kit_contents}")
    else:
        await ctx.send(f"Kit {kit_name} not found. Tried {kit_path}")

@bot.command(name='proposal')
async def create_proposal(ctx, num_locations: int, *, locations: str):
    # Parse the locations using shlex
    location_list = shlex.split(locations)
    if len(location_list) != num_locations:
        await ctx.send("The number of locations provided does not match the specified number.")
        return

    # Remove surrounding quotes from location names
    location_list = [loc.strip("'\"") for loc in location_list]

    embed = discord.Embed(title="Poll: Choose a Location", description="Vote for the location you prefer.", color=0x00ff00)
    for i, location in enumerate(location_list, start=1):
        embed.add_field(name=f"Option {i}", value=location, inline=False)

    message = await ctx.send(embed=embed)
    for i in range(num_locations):
        await message.add_reaction(f"{i+1}\u20e3")  # Adds number reactions for voting

bot.run('token')
