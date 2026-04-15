import { Octokit } from "@octokit/rest";

export async function pushToGithub(
  token: string,
  ownerRepo: string,
  branch: string,
  commitMessage: string,
  files: Record<string, string>
) {
  const octokit = new Octokit({ auth: token });
  const [owner, repo] = ownerRepo.split("/");

  if (!owner || !repo) {
    throw new Error("Repository must be in format 'owner/repo'");
  }

  // Get the current commit object
  const { data: refData } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${branch}`,
  });
  const commitSha = refData.object.sha;

  // Get the commit
  const { data: commitData } = await octokit.git.getCommit({
    owner,
    repo,
    commit_sha: commitSha,
  });
  const treeSha = commitData.tree.sha;

  // Create blobs and tree items
  const tree = await Promise.all(
    Object.entries(files).map(async ([path, content]) => {
      // Remove leading slash if present
      const cleanPath = path.startsWith("/") ? path.slice(1) : path;
      
      const { data: blobData } = await octokit.git.createBlob({
        owner,
        repo,
        content,
        encoding: "utf-8",
      });

      return {
        path: cleanPath,
        mode: "100644" as const,
        type: "blob" as const,
        sha: blobData.sha,
      };
    })
  );

  // Create a new tree
  const { data: newTree } = await octokit.git.createTree({
    owner,
    repo,
    tree,
    base_tree: treeSha,
  });

  // Create a new commit
  const { data: newCommit } = await octokit.git.createCommit({
    owner,
    repo,
    message: commitMessage,
    tree: newTree.sha,
    parents: [commitSha],
  });

  // Update the reference
  await octokit.git.updateRef({
    owner,
    repo,
    ref: `heads/${branch}`,
    sha: newCommit.sha,
  });

  return newCommit.html_url;
}
