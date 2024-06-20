// Import required modules
import { Octokit } from "octokit";
import inquirer from "inquirer";

async function prompter() {
  const responses = await inquirer.prompt([
    {
      type: "list",
      name: "accountType",
      message: "SELECT YOUR ACCOUNT TYPE",
      choices: ["Personal", "Organizataion"],
    },
    {
      type: "input",
      name: "owner",
      message: "ENTER YOUR USERNAME OR ORG NAME HERE",
    },
    {
      type: "password",
      name: "token",
      message: "ENTER YOUR GITHUB API TOKEN",
    },
    {
      type: "list",
      name: "visibility",
      message: "SELECT YOUR REPOS VISIBILITY",
      choices: ["Public", "Private"],
    },
  ]);
  return responses;
}

// Define an async function to handle the main logic
async function updateRepositories(octokit, owner, accountType, visibility) {
  const repos = [];
  // Fetch a list of repositories, even if they span across multiple pages
  if (accountType === "Personal") {
    repos = await octokit.paginate(octokit.rest.repos.listForUser, {
      username: owner,
    });
  } else if (accountType === "Organizataion") {
    repos = await octokit.paginate(octokit.rest.repos.listForOrg, {
      org: owner,
    });
  } else {
    console.log("Invalid Account Type");
    process.exit(1);
  }

  // Use this if you are updating repos for an org rather than a user
  const failed = [];
  let i = 0;

  // Iterate over each repository and attempt to update its privacy setting
  for (const { name: repo } of repos) {
    console.log(`${++i}: ${repo}`);
    try {
      await octokit.request("PATCH /repos/{owner}/{repo}", {
        owner,
        repo,
        private: visibility === "Public" ? false : true,
      });
      console.log("success");
    } catch (e) {
      failed.push(repo);
      console.log("failed");
    }
  }

  // Output the list of repositories that failed to update
  console.log("failed updates:", JSON.stringify(failed, null, 2));
}

async function main() {
  const responses = await prompter();
  // Initialize Octokit with authentication
  const octokit = new Octokit({ auth: responses.token });
  await updateRepositories(
    octokit,
    responses.owner,
    responses.accountType,
    responses.visibility
  );
}

main();
