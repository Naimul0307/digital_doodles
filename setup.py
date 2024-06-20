from cx_Freeze import setup, Executable

# Specify the base directory and script to be packaged
base = None
executables = [Executable("app.py", base=base)]

# Additional options for the setup
options = {
    "build_exe": {
        "packages": [],  # List of packages to include
        "include_files": [
            ("static", "static"),  # Include the static folder
            ("templates", "templates")  # Include the templates folder
        ],
    },
}

setup(
    name="Naim",
    version="1.0",
    description="Description of your app",
    options=options,
    executables=executables
)
